package com.ovaltrack.backend.common.mail.service;

import org.springframework.beans.factory.annotation.Value;
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
    @Value("${invitation.url}")
    private String url;

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
    public void sendInvitation(Invitation invitation, String token) throws MessagingException {
        try {
            MimeMessage message = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF8");
            helper.setTo(invitation.getPerson().getContactEmail());
            helper.setSubject("Unite a Ovaltrack!");
            Context context = setVariables(invitation, token);

            String contentHTML = templateEngine.process("email", context);

            helper.setText(contentHTML, true);
            javaMailSender.send(message);

        } catch (Exception e) {
            throw new BusinessException("Error al enviar el correo" + e.getMessage());
        }
    }

    private Context setVariables(Invitation invitation, String token) {
        String userName = invitation.getPerson().getFirstName() + " " + invitation.getPerson().getLastName();
        Context context = new Context();
        context.setVariable("userName", userName);
        context.setVariable("clubName", invitation.getClub().getName());
        context.setVariable("userEmail", invitation.getPerson().getContactEmail());
        context.setVariable("urlInvitation", getUrlInvitationWithToken(token));
        return context;
    }

    private String getUrlInvitationWithToken(String token){
        return String.format("%s?%s=%s", this.url,"token",token);
    }

}
