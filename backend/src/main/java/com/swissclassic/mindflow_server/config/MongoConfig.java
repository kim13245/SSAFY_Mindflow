package com.swissclassic.mindflow_server.config;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoDatabase;
import lombok.extern.slf4j.Slf4j;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.MongoDatabaseFactory;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;

import javax.annotation.PostConstruct;

@Configuration
@EnableMongoRepositories(basePackages = "com.swissclassic.mindflow_server.conversation.repository")
@Slf4j
public class MongoConfig {

    // application.yml에서 값을 주입받음
    @Value("${spring.data.mongodb.uri}")
    private String mongoUri;

    @Value("${spring.data.mongodb.database:mindflow_db}")  // 기본값 mindflow_db
    private String databaseName;

    @Bean
    public MongoTemplate mongoTemplate(MongoDatabaseFactory mongoDbFactory) {
        return new MongoTemplate(mongoDbFactory);
    }

    @PostConstruct
    public void checkMongoConnection() {
        try (MongoClient mongoClient = com.mongodb.client.MongoClients.create(mongoUri)) {
            MongoDatabase database = mongoClient.getDatabase(databaseName);
            database.runCommand(new Document("ping", 1));
            log.info("MongoDB 연결 성공: {}", mongoUri);
        } catch (Exception e) {
            log.error("MongoDB 연결 실패: ", e);
        }
    }
}
