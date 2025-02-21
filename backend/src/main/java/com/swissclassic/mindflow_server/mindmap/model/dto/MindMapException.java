package com.swissclassic.mindflow_server.mindmap.model.dto;

import lombok.Getter;
import org.springframework.http.HttpStatus;

public class MindMapException extends RuntimeException {
    public MindMapException(String message) {
        super(message);
    }

    public MindMapException(String message, Throwable cause) {
        super(message, cause);
    }
}