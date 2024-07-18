const handleForm = ({
  formId,
  submitBtnId,
  hasPhoneNumber,
  phoneNumberIsRequired,
  customTextFields = [],
  customCheckFields = [],
  customUrlFields = [],
  forceChecksTrue = [],
  klaviyoA,
  klaviyoG,
  submitFunction = () => {},
}) => {
  const getTopLevelDomain = () => {
    const fullDomain = window.location.hostname;
    const domainRegex = /\.([a-z]{2,})\.([a-z]{2,})$/;
    const match = fullDomain.match(domainRegex);
    if (match) {
      return `.${match[1]}.${match[2]}`;
    } else {
      return fullDomain;
    }
  };
  const cookieConfig = `path=/; domain=${getTopLevelDomain()};max-age=3600`;

  let iti;
  let phoneField;
  const submitBtn = document.getElementById(submitBtnId);
  const form = document.getElementById(formId);
  const urlParams = new URLSearchParams(window.location.search);

  if (hasPhoneNumber) {
    phoneField = document.getElementById("phone_number");
    const disableSubmitBtn = () => {
      submitBtn.setAttribute("disabled", "disabled");
      submitBtn.style.filter = "contrast(0.5)";
      submitBtn.style.cursor = "not-allowed";
    };

    let phoneNumberIsNotValid;
    if (phoneNumberIsRequired) {
      disableSubmitBtn();
      phoneNumberIsNotValid = () => !iti.isValidNumber();
    } else {
      phoneNumberIsNotValid = () => phoneField.value.trim() !== "" && !iti.isValidNumber();
    }

    iti = window.intlTelInput(phoneField, {
      utilsScript: "https://cdn.jsdelivr.net/npm/intl-tel-input@23.3.2/build/js/utils.js",
      autoPlaceholder: "aggressive",
      initialCountry: "auto",
      geoIpLookup: async (success, failure) => {
        try {
          const cookieCountry = document.cookie.split("user_country=")[1]?.split(";")[0];
          if (cookieCountry) {
            success(cookieCountry);
            return;
          }
          const response = await fetch("https://get.geojs.io/v1/ip/country.json");
          const data = await response.json();
          if (response.ok) {
            document.cookie = `user_country=${data.country};${cookieConfig}`;
            success(data.country);
          } else throw new error("Error Fetching Ip", response, data);
        } catch (e) {
          console.warn(e);
          failure();
        }
      },
    });
    phoneField.addEventListener("input", () => {
      if (phoneNumberIsNotValid()) {
        submitBtn.setAttribute("disabled", "disabled");
      } else {
        submitBtn.removeAttribute("disabled");
        phoneField.style = "";
        submitBtn.style = "";
      }
    });
    phoneField.addEventListener("focusout", () => {
      if (phoneNumberIsNotValid()) {
        phoneField.style.borderColor = "red";
        phoneField.style.outline = "1px solid red";
        disableSubmitBtn();
      }
    });
    const invalidPhoneField = () => {
      alert("Phone field invalid. Please check if every number is present.");
    };
    form.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && submitBtn.hasAttribute("disabled")) {
        invalidPhoneField();
      }
    });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    if (hasPhoneNumber) {
      phoneField.value.trim === "" ? formData.set("phone_number", "") : formData.set("phone_number", iti.getNumber());
    }

    formData.append("$fields", [...customTextFields, ...customCheckFields, ...customUrlFields]);
    customUrlFields.forEach((urlParam) => {
      formData.append(urlParam, urlParams.get(urlParam));
    });

    customCheckFields.forEach((checkFieldId) => {
      const field = document.getElementById(checkFieldId);
      formData.set(checkFieldId, field.checked ? true : false);
    });

    forceChecksTrue.forEach((checkFieldId) => {
      formData.set(checkFieldId, true);
    });

    try {
      const data = await fetch(`https://manage.kmail-lists.com/ajax/subscriptions/subscribe?a=${klaviyoA}&g=${klaviyoG}`, {
        method: "POST",
        body: formData,
      });
      const response = await data.json();
      console.log(response);
    } catch (e) {
      console.warn("Error sending to klaviyo", e);
    }
  });

  const initObserver = () => {
    const targetElement = document.querySelector(".w-form-done");
    const observer = new MutationObserver((mutationsList) => {
      for (const mutation of mutationsList) {
        if (mutation.attributeName === "style") {
          const displayChanged = mutation.target.style.display !== mutation.oldValue;
          if (displayChanged) {
            submitFunction();
          }
        }
      }
    });
    observer.observe(targetElement, {
      attributes: true,
      attributeOldValue: true,
    });
  };
  initObserver();
};
