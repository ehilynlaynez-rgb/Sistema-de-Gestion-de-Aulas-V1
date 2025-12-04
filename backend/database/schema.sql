CREATE DATABASE IF NOT EXISTS gestion_aulas;
USE gestion_aulas;

CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol ENUM('ADMIN', 'USUARIO') DEFAULT 'USUARIO',
    telefono VARCHAR(20),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rooms (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    modulo VARCHAR(50) NOT NULL,
    estado ENUM('Libre', 'Ocupada') DEFAULT 'Libre',
    ocupado_por INT NULL,
    qr_url TEXT,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ocupado_por) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS resources (
    id INT PRIMARY KEY AUTO_INCREMENT,
    aula_id INT NOT NULL,
    tipo VARCHAR(100) NOT NULL,
    codigo VARCHAR(50) NOT NULL,
    estado ENUM('Activo', 'Dañado', 'Reparado') DEFAULT 'Activo',
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (aula_id) REFERENCES rooms(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reservations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    instructor_id INT NOT NULL,
    aula_id INT NOT NULL,
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    grupo_whatsapp VARCHAR(255),
    estado ENUM('Activa', 'Completada', 'Cancelada') DEFAULT 'Activa',
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (aula_id) REFERENCES rooms(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT,
    accion VARCHAR(255) NOT NULL,
    tabla VARCHAR(50),
    registro_id INT,
    detalles TEXT,
    ip VARCHAR(50),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE SET NULL
);


INSERT INTO rooms (id, nombre, modulo, estado, ocupado_por) VALUES 
(1, 'Aula 1', 'Modulo 1', 'Libre', NULL),
(3, 'Aula 3', 'Modulo 1', 'Libre', NULL),
(4, 'Aula 4', 'Modulo 1', 'Libre', NULL),
(5, 'Salon Ejecutivo', 'Modulo 2', 'Libre', NULL),
(6, 'Salon Ejecutivo', 'Modulo 2', 'Libre', NULL);
