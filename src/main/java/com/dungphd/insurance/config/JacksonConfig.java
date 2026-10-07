package com.dungphd.insurance.config;

import com.fasterxml.jackson.databind.Module;
import com.fasterxml.jackson.databind.module.SimpleModule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Instant;

@Configuration
public class JacksonConfig {

    @Bean
    public Module flexibleInstantModule() {
        SimpleModule module = new SimpleModule();
        module.addDeserializer(Instant.class, new FlexibleInstantDeserializer());
        return module;
    }
}
