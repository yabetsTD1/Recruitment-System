<#macro registrationLayout bodyClass="" displayInfo=false displayMessage=true displayRequiredFields=false displayWide=false showAnotherWayIfPresent=true>
<!DOCTYPE html>
<html lang="${locale.currentLanguageTag}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex, nofollow">
    <title>INSA-ERP — Staff Login</title>
    <link rel="icon" href="http://localhost:3000/logo.png" type="image/png">
    <link rel="stylesheet" href="${url.resourcesPath}/css/login.css">
</head>
<body>
    <#nested "form">
    <script src="${url.resourcesPath}/js/login.js"></script>
</body>
</html>
</#macro>
