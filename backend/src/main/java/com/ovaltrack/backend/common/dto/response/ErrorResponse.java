package com.ovaltrack.backend.common.dto.response;

import java.util.Date;

import lombok.Getter;
import lombok.Setter;

@Getter 
@Setter 
public class ErrorResponse {
    private String error;
    private String message;
    private int status;
    private Date date;
    
}
