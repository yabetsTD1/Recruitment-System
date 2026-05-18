package com.recruitment.recruitmentbackend.config;

import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Converts a Keycloak JWT into a Spring Security authentication token.
 * Extracts roles from realm_access.roles and maps them to ROLE_* authorities.
 * Supported roles: SUPER_ADMIN, ADMIN, EMPLOYEE
 */
@Component
public class KeycloakJwtConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        Collection<GrantedAuthority> authorities = extractRealmRoles(jwt);
        // Use "preferred_username" or "email" as principal name
        String principalName = jwt.getClaimAsString("email");
        if (principalName == null) {
            principalName = jwt.getClaimAsString("preferred_username");
        }
        return new JwtAuthenticationToken(jwt, authorities, principalName);
    }

    @SuppressWarnings("unchecked")
    private Collection<GrantedAuthority> extractRealmRoles(Jwt jwt) {
        Map<String, Object> realmAccess = jwt.getClaimAsMap("realm_access");
        if (realmAccess == null) return Collections.emptyList();

        Object rolesObj = realmAccess.get("roles");
        if (!(rolesObj instanceof List)) return Collections.emptyList();

        List<String> roles = (List<String>) rolesObj;
        return roles.stream()
                .filter(role -> List.of("SUPER_ADMIN", "ADMIN", "EMPLOYEE").contains(role))
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
                .collect(Collectors.toList());
    }
}
