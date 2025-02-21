package com.swissclassic.mindflow_server.conversation.model.entity;

import lombok.Getter;
import lombok.Setter;
import org.bson.types.ObjectId;

@Setter
@Getter
public class Sentence {

    // Getters and Setters
    private ObjectId sentence_id; // MongoDB ObjectId
    private String content;

    // Default constructor (required for MongoDB deserialization)
    public Sentence() {}

    // Parameterized constructor
    public Sentence(ObjectId sentence_id, String content) {
        this.sentence_id = sentence_id;
        this.content = content;
    }

    // toString method for debugging
    @Override
    public String toString() {
        return "Sentence{" +
                "sentence_id=" + sentence_id +
                ", content='" + content + '\'' +
                '}';
    }
}