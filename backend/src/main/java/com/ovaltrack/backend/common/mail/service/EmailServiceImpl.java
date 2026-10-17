package com.ovaltrack.backend.common.mail.service;

import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import com.ovaltrack.backend.common.config.exceptions.BusinessException;
import com.ovaltrack.backend.common.mail.dto.EmailDTO;
import com.ovaltrack.backend.invitations.domain.Invitation;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender javaMailSender;
    private final TemplateEngine templateEngine;

    public EmailServiceImpl(final JavaMailSender javaMailSender, final TemplateEngine templateEngine) {
        this.javaMailSender = javaMailSender;
        this.templateEngine = templateEngine;
    }

    @Override
    public void sendEmail(EmailDTO email) throws MessagingException {
        try {
            MimeMessage message = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF8");
            helper.setTo(email.getTo());
            helper.setSubject(email.getSubject());
            // helper.setText(email.getContent());
            Context context = new Context();
            context.setVariable("message", email.getContent());

            String contentHTML = templateEngine.process("email", context);

            helper.setText(contentHTML, true);
            javaMailSender.send(message);

        } catch (Exception e) {
            throw new BusinessException("Error al enviar el correo" + e.getMessage());
        }
    }

    @Override 
    public void sendInvitation(Invitation invitation, String hash) throws MessagingException {
        try {
            MimeMessage message = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF8");
            // helper.setTo(invitation.getPerson().getContactEmail());
            helper.setTo("ovaltrack7@gmail.com");
            helper.setSubject("Unite a Ovaltrack!");

            String userName = invitation.getPerson().getFirstName() + " " + invitation.getPerson().getLastName(); 
            Context context = new Context();
            context.setVariable("userName", userName);
            context.setVariable("clubName", invitation.getClub().getName());
            context.setVariable("userEmail", invitation.getPerson().getContactEmail());
            context.setVariable("hash", hash);
            // context.setVariable("message", email.getContent());

            String contentHTML = templateEngine.process("email", context);

            helper.setText(contentHTML, true);
            javaMailSender.send(message);

        } catch (Exception e) {
            throw new BusinessException("Error al enviar el correo" + e.getMessage());
        }
    }

}
