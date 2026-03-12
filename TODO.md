# PLANO DO PROJETO - BARBEARIA BUENO

## 1. INFORMAÇÕES COLETADAS
O usuário deseja um site completo de barbearia com as seguintes funcionalidades:
- **Nome da Barbearia**: BARBEARIA BUENO
- **Preços dos Serviços**:
  - Corte Social: R$ 25
  - Corte Navalhado: R$ 30
  - Sobrancelha: R$ 5
  - Luzes: R$ 60
  - Barba: R$ 20
  - Pezinho: R$ 15
- **Funcionalidades**:
  - Calendário para agendamento
  - Sistema de cadastro/login com animações profissionais
  - Banco de dados para armazenar clientes
  - Painel admin para ver agendamentos
  - Formulário: dia, cortes, nome, pagamento (dinheiro/pix/cartão)
  - Muita animação e design bonito

## 2. ARQUITETURA DO PROJETO

### Tecnologias:
- **Frontend**: HTML5, CSS3 (animações), JavaScript
- **Backend**: Node.js com Express
- **Banco de Dados**: SQLite (simples, não requer instalação)
- **Template Engine**: EJS

### Estrutura de Arquivos:
```
ryan_barber/
├── server.js           (Backend principal)
├── database.js         (Configuração do SQLite)
├── package.json        (Dependências)
├── public/
│   ├── css/
│   │   ├── style.css   (Estilos principais)
│   │   └── login.css   (Estilos do login)
│   └── js/
│       └── main.js     (Scripts do frontend)
├── views/
│   ├── index.html      (Página inicial)
│   ├── login.ejs       (Tela de login)
│   ├── register.ejs    (Tela de cadastro)
│   ├── agendamento.ejs (Página de agendamento)
│   └── admin.ejs       (Painel admin)
└── database/
    └── barbearia.db    (Banco SQLite)
```

## 3. PLANO DE IMPLEMENTAÇÃO

### Passo 1: Configuração do Projeto
- Criar package.json
- Instalar dependências (express, sqlite3, bcrypt, ejs, express-session)

### Passo 2: Banco de Dados
- Criar database.js com configuração SQLite
- Criar tabelas: usuarios, agendamentos

### Passo 3: Backend (server.js)
- Rotas de autenticação (login, register, logout)
- Rotas de agendamento
- Rotas admin

### Passo 4: Frontend - Estilos CSS
- Animações profissionais para login/cadastro
- Design moderno e elegante
- Cores: dourado, preto, branco (tema барбершоп)

### Passo 5: Frontend - Páginas
- Página inicial com informações
- Login com animação
- Cadastro com validação
- Agendamento com calendário
- Painel Admin

## 4. DEPENDÊNCIAS A INSTALAR
- express
- sqlite3
- bcryptjs
- ejs
- express-session

## 5. PRÓXIMOS PASSOS
Após aprovação do plano:
1. Criar estrutura de diretórios
2. Implementar backend
3. Implementar frontend com animações
4. Testar aplicação

