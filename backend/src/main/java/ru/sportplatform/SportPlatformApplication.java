package ru.sportplatform;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class SportPlatformApplication {
    public static void main(String[] args) {
        SpringApplication.run(SportPlatformApplication.class, args);
    }
}
