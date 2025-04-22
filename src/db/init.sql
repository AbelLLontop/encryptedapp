CREATE TABLE IF NOT EXISTS credentials(
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    username TEXT NOT NULL,
    password TEXT NOT NULL,
    iv TEXT NOT NULL
);
