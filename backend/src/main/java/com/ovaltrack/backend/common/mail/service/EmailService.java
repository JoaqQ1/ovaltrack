package com.ovaltrack.backend.common.mail.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private Logger logger = LoggerFactory.getLogger(getClass());

    @Value("${spring.mail.username}")
    private String from;

    private JavaMailSender emailSender;

    public EmailService(JavaMailSender emailSender) {
        logger.info("Email destinatario " + from);
        this.emailSender = emailSender;
    }

    public void sendEmail(String to, String subject, String content) {
        logger.info("Creando correo");
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject(subject);
        message.setText(content);
        message.setFrom(this.from);
        emailSender.send(message);

    }
}
