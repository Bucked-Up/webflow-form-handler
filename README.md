# Script for handling form submissions on webflow

### Place this on footer and change as necessary:

#### If has Phone Number

```
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/intl-tel-input@23.3.2/build/css/intlTelInput.css"></link>
<script src="https://cdn.jsdelivr.net/npm/intl-tel-input@23.3.2/build/js/intlTelInput.min.js"></script>
<style>.iti {width: 100%;}</style>
```

```
<script src="https://cdn.jsdelivr.net/gh/Bucked-Up/webflow-form-handler@2/script.min.js"></script>
<script>
  handleForm({
    formId: "",
    submitBtnId: "",
    hasPhoneNumber: false,
    phoneNumberIsRequired: false,
    ghl: { //optional
      formId: "",
      location_id: "",
      captchaToken: "",
      hasMida: false, //value would be the field id for the uuid
      fields: ["full_name","email","phone"]
      customFields: [["message","testId"],]
    },
    hubspot: { endpoint: "" }, //optional
    klaviyo: { //optional
      klaviyoA: "",
      klaviyoG: "",
      customTextFields: [], //optional
      customCheckFields: [], //optional
      forceChecksTrue: [], //optional
    },
    custom: { //cant be used along with ghl yet. optional.
      customFunc: ()=>{},
      hasCaptcha: "",
    },
    submitFunction: ()=>{}
  })
</script>
```

### Aisle

```
<script src="https://cdn.jsdelivr.net/gh/Bucked-Up/webflow-form-handler@1/aisle.min.js"></script>
<script>
  handleForm({
    campaignPhoneNumber: "",
    apiKey: "",
    submitBtnId: "",
    formId: "",
    klaviyoA: "",
    klaviyoG: "",
    submitFunction: ()=>{},
  })
</script>
```
