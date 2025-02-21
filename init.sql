create table if not exists llm_providers
(
    id          bigint auto_increment
        primary key,
    name        varchar(50)  not null,
    api_address varchar(255) not null
);

create table if not exists model_versions
(
    id          bigint auto_increment
        primary key,
    provider_id bigint       not null,
    name        varchar(255) not null,
    api_name    varchar(255) not null,
    constraint model_versions_ibfk_1
        foreign key (provider_id) references llm_providers (id)
            on delete cascade
);

create table if not exists model_price
(
    id           bigint auto_increment
        primary key,
    input_price  bigint not null,
    output_price bigint not null,
    constraint model_price_model_versions_id_fk
        foreign key (id) references model_versions (id)
);

create index provider_id
    on model_versions (provider_id);

create table if not exists users
(
    id            bigint auto_increment
        primary key,
    account_id    varchar(50)                         not null,
    username      varchar(50)                         not null,
    password      varchar(255)                        not null,
    display_name  varchar(100)                        null,
    email         varchar(255)                        not null,
    created_at    timestamp default CURRENT_TIMESTAMP null,
    refresh_token varchar(255)                        null,
    social_id     varchar(255)                        null,
    social_provider enum ('NONE', 'GOOGLE', 'GITHUB', 'KAKAO') default 'NONE' not null,
    constraint account_id
        unique (account_id),
    constraint email
        unique (email)
);

create table if not exists chat_rooms
(
    id         bigint auto_increment
        primary key,
    title      varchar(255)                         not null,
    creator_id bigint                               not null,
    created_at timestamp  default CURRENT_TIMESTAMP null,
    starred    tinyint(1) default 0                 null,
    constraint chat_rooms_ibfk_1
        foreign key (creator_id) references users (id)
            on delete cascade,
    constraint fk_user
        foreign key (creator_id) references users (id)
            on delete cascade
);

