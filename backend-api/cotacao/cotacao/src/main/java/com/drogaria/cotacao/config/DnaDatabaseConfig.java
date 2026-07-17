package com.drogaria.cotacao.config;

import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import javax.sql.DataSource;

@Configuration
public class DnaDatabaseConfig {

    @Value("${dna.datasource.url}")
    private String dbUrl;

    @Value("${dna.datasource.username}")
    private String dbUser;

    @Value("${dna.datasource.password}")
    private String dbPassword;

    @Value("${dna.datasource.driver-class-name}")
    private String dbDriver;

    @Bean(name = "dnaDataSource")
    public DataSource dnaDataSource() {
        HikariDataSource dataSource = new HikariDataSource();
        dataSource.setJdbcUrl(dbUrl);
        dataSource.setUsername(dbUser);
        dataSource.setPassword(dbPassword);
        dataSource.setDriverClassName(dbDriver);
        dataSource.setReadOnly(true);

        return dataSource;
    }

    @Bean(name = "dnaJdbcTemplate")
    public JdbcTemplate dnaJdbcTemplate(@Qualifier("dnaDataSource") DataSource dnaDataSource) {
        return new JdbcTemplate(dnaDataSource);
    }

    @Bean(name = "dnaNamedJdbcTemplate")
    public NamedParameterJdbcTemplate dnaNamedJdbcTemplate(@Qualifier("dnaDataSource") DataSource dnaDataSource) {
        return new NamedParameterJdbcTemplate(dnaDataSource);
    }

    @Configuration
    public class CorsConfig implements WebMvcConfigurer {

        @Override
        public void addCorsMappings(CorsRegistry registry) {
            registry.addMapping("/**")
                    .allowedOrigins(
                            "https://cotacaotorresfarma.netlify.app",
                            "http://localhost:5173", 
                            "http://localhost:3000" 
                    )
                    .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH")
                    .allowedHeaders("*") 
                    .allowCredentials(true);
        }
    }
}