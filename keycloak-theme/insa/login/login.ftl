<#import "template.ftl" as layout>
<@layout.registrationLayout; section>
    <#if section = "form">

    <div id="insa-wrapper">

        <!-- Logo -->
        <div class="insa-logo-area">
            <img src="http://localhost:3000/logo.png" alt="INSA Logo" class="insa-logo-img" onerror="this.style.display='none'">
            <span class="insa-app-name">INSA-ERP</span>
            <span class="insa-app-sub">Recruitment Management System</span>
        </div>

        <!-- Card -->
        <div class="insa-card">
            <h2 class="insa-card-title">Staff Login</h2>
            <p class="insa-card-desc">Sign in to access your dashboard</p>

            <#-- Error message -->
            <#if message?has_content && message.type = "error">
                <div class="insa-error">${kcSanitize(message.summary)?no_esc}</div>
            </#if>

            <form id="kc-form-login" action="${url.loginAction}" method="post">

                <#-- Username / Email -->
                <div class="insa-field">
                    <label class="insa-label" for="username">
                        <#if !realm.loginWithEmailAllowed>Username
                        <#elseif !realm.registrationEmailAsUsername>Username or Email
                        <#else>Email Address
                        </#if>
                    </label>
                    <input
                        id="username"
                        name="username"
                        class="insa-input"
                        type="text"
                        value="${(login.username!'')}"
                        placeholder="you@insa.gov.et"
                        autofocus
                        autocomplete="username"
                    />
                </div>

                <#-- Password -->
                <div class="insa-field">
                    <label class="insa-label" for="password">Password</label>
                    <div class="insa-input-wrap">
                        <input
                            id="password"
                            name="password"
                            class="insa-input"
                            type="password"
                            placeholder="Enter your password"
                            autocomplete="current-password"
                        />
                        <button type="button" class="insa-eye-btn" id="eye-btn" onclick="togglePassword()" title="Show/hide password">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                <circle cx="12" cy="12" r="3"/>
                            </svg>
                        </button>
                    </div>
                </div>

                <#-- Hidden credential id -->
                <input type="hidden" name="credentialId" <#if auth.selectedCredential?has_content>value="${auth.selectedCredential}"</#if>/>

                <#-- Submit -->
                <button type="submit" class="insa-btn">Sign In</button>

                <#-- Forgot password -->
                <#if realm.resetPasswordAllowed>
                    <div class="insa-forgot">
                        <a href="${url.loginResetCredentialsUrl}">Forgot password?</a>
                    </div>
                </#if>

            </form>
        </div>

        <!-- Back to public site -->
        <div class="insa-back">
            <a href="http://localhost:3000">← Back to Public Site</a>
        </div>

    </div>

    </#if>
</@layout.registrationLayout>
