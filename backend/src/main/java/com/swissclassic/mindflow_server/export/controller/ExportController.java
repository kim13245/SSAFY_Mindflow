//package com.swissclassic.mindflow_server.export.controller;
//
//import com.swissclassic.mindflow_server.export.service.ExportMarkdownService;
//import io.swagger.v3.oas.annotations.Operation;
//import io.swagger.v3.oas.annotations.tags.Tag;
//import lombok.extern.slf4j.Slf4j;
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.http.ResponseEntity;
//import org.springframework.stereotype.Controller;
//import org.springframework.web.bind.annotation.*;
//
//@Slf4j
//@RestController
//@RequestMapping("/api/export")
//@Tag(name = "export", description = "채팅 내보내기 API")
//public class ExportController {
//    @Autowired
//    private ExportMarkdownService exportMarkdownService;
//
//    @GetMapping("/{messageId}")
//    public ResponseEntity<?> exportMessageIntoMarkdown(@PathVariable long messageId) {
//        return ResponseEntity.ok(exportMarkdownService.exportChatToMarkdown(messageId));
//    }
//}
