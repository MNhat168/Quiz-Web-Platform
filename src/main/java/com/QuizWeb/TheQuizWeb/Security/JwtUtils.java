package com.QuizWeb.TheQuizWeb.Security;

import com.QuizWeb.TheQuizWeb.Model.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import java.security.Key;
import java.util.Base64;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.util.Date;

@Component
public class JwtUtils {

    private final String jwtSecretBase64 = "oKg2mOd5zyTZyCk6WZc7v2ECbmV0cbO8z+kFTcqgA0zEB5F+jZ5O9uK0zEqSy02EjrYheWzJIBOtiC/1bUXE+A==";
    private final Key key = Keys.hmacShaKeyFor(Base64.getDecoder().decode(jwtSecretBase64));

    public String generateToken(User user) {
        return Jwts.builder()
                .setSubject(user.getUsername())
                .claim("role", user.getRole().name())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 86400000))
                .signWith(key, SignatureAlgorithm.HS512)
                .compact();
    }

    public Claims extractClaims(String token) {
        return Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token).getBody();
    }

    public String extractUsername(String token) {
        return extractClaims(token).getSubject();
    }

    public boolean validateToken(String token, UserDetails userDetails) {
        final String email = extractUsername(token);
        return (email.equals(userDetails.getUsername()) && !extractClaims(token).getExpiration().before(new Date()));
    }
}
