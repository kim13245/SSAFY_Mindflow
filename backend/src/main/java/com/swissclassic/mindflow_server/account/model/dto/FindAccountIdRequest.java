package com.swissclassic.mindflow_server.account.model.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FindAccountIdRequest {
    String name;
    String email;
}
