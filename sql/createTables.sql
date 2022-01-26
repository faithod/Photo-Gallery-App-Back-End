DROP TABLE IF EXISTS users, favourites;

create table users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL
);

create table favourites (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  photo_id INT NOT NULL,
  alt VARCHAR(255),
  url VARCHAR(255) NOT NULL,
  FOREIGN KEY (user_id) references users (id)
);