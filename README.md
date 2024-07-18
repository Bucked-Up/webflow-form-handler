# Script for handling form submissions on webflow

### Place this on footer and change as necessary:

```
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/intl-tel-input@23.3.2/build/css/intlTelInput.css"></link>
<script src="https://cdn.jsdelivr.net/npm/intl-tel-input@23.3.2/build/js/intlTelInput.min.js"></script>
<style>.iti {width: 100%;}</style>
<script src="https://cdn.jsdelivr.net/gh/Bucked-Up/webflow-form-handler@1/script.js"></script>
<script>
  handleForm({
    formId: "",
    submitBtnId: "",
    hasPhoneNumber: false,
    phoneNumberIsRequired: false,
    customTextFields: [],
    customCheckFields: [],
    customUrlFields: ["utm_source", "utm_medium", "utm_content", "gclid", "fbclid"],
    klaviyoA: "",
    klaviyoG: "",
    submitFunction: () => {},
  });
</script>
```
