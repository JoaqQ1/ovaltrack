package com.ovaltrack.backend.common.mail.service;

import com.ovaltrack.backend.common.mail.dto.EmailDTO;
import com.ovaltrack.backend.invitations.domain.Invitation;

import jakarta.mail.MessagingException;

public interface EmailService {
    public void sendEmail(EmailDTO email) throws MessagingException;

    public void sendInvitation(Invitation invitation, String hash) throws MessagingException;
}
