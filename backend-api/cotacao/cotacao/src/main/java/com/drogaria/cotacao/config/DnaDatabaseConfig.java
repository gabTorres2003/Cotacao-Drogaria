package com.drogaria.cotacao.config;

import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;
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
    public JdbcTemplate dnaJdbcTemplate(DataSource dnaDataSource) {
        return new JdbcTemplate(dnaDataSource);
    }
}