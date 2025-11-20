CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    email VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT password_format CHECK (password LIKE '%#%')
    );

CREATE TABLE report (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    content VARCHAR(1000) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL,
    CONSTRAINT fk_user 
        FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT status_check 
        CHECK (status IN ('pending', 'readed', 'solved', 'rejected'))
   );
