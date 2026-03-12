const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(session({
  secret: 'barbearia-bueno-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 horas
}));

// Variável global de preços
const PRECOS = {
  'corte-social': { nome: 'Corte Social', preco: 25 },
  'corte-navalhado': { nome: 'Corte Navalhado', preco: 30 },
  'sobrancelha': { nome: 'Sobrancelha', preco: 5 },
  'luzes': { nome: 'Luzes', preco: 60 },
  'barba': { nome: 'Barba', preco: 20 },
  'pezinho': { nome: 'Pezinho', preco: 15 }
};

// Middleware para verificar autenticação
const requireAuth = (req, res, next) => {
  if (req.session.usuario) {
    next();
  } else {
    res.redirect('/login');
  }
};

const requireAdmin = (req, res, next) => {
  if (req.session.usuario && req.session.usuario.is_admin) {
    next();
  } else {
    res.redirect('/');
  }
};

// ============ ROTAS ============

// Página inicial
app.get('/', (req, res) => {
  res.render('index', { 
    usuario: req.session.usuario,
    precos: PRECOS
  });
});

// Login
app.get('/login', (req, res) => {
  if (req.session.usuario) {
    return res.redirect('/agendamento');
  }
  res.render('login', { erro: null, usuario: null, query: req.query });
});

app.post('/login', (req, res) => {
  const { email, senha } = req.body;
  
  db.get('SELECT * FROM usuarios WHERE email = ?', [email], (err, usuario) => {
    if (err || !usuario) {
      return res.render('login', { erro: 'Email não encontrado!', usuario: null, query: {} });
    }
    
    const senhaValida = bcrypt.compareSync(senha, usuario.senha);
    if (!senhaValida) {
      return res.render('login', { erro: 'Senha incorreta!', usuario: null, query: {} });
    }
    
    req.session.usuario = usuario;
    
    if (usuario.is_admin) {
      res.redirect('/admin');
    } else {
      res.redirect('/agendamento');
    }
  });
});

// Cadastro
app.get('/cadastro', (req, res) => {
  if (req.session.usuario) {
    return res.redirect('/agendamento');
  }
  res.render('register', { erro: null, usuario: null });
});

app.post('/cadastro', (req, res) => {
  const { nome, telefone, email, senha, confirmar_senha } = req.body;
  
  if (senha !== confirmar_senha) {
    return res.render('register', { erro: 'As senhas não coincidem!', usuario: null });
  }
  
  const senhaHash = bcrypt.hashSync(senha, 10);
  
  // Verificar se email já existe
  db.get('SELECT email FROM usuarios WHERE email = ?', [email], (err, existing) => {
    if (existing) {
      return res.render('register', { erro: 'Email já cadastrado!', usuario: null });
    }
    
    db.run(
      'INSERT INTO usuarios (nome, telefone, email, senha) VALUES (?, ?, ?, ?)',
      [nome, telefone, email, senhaHash],
      function(err) {
        if (err) {
          return res.render('register', { erro: 'Erro ao cadastrar. Tente novamente!', usuario: null });
        }
        
        res.redirect('/login?sucesso=1');
      }
    );
  });
});

// Agendamento
app.get('/agendamento', requireAuth, (req, res) => {
  const usuario = req.session.usuario;
  
  // Buscar todos os dias com agendamentos (para mostrar ocupados)
  db.all(
    'SELECT DISTINCT data_agendamento FROM agendamentos WHERE status != "cancelado"',
    (err, diasOcupados) => {
      const diasFormatados = diasOcupados ? diasOcupados.map(d => d.data_agendamento) : [];
      
      // Buscar agendamentos do usuário
      db.all(
        'SELECT * FROM agendamentos WHERE usuario_id = ? ORDER BY data_agendamento DESC',
        [usuario.id],
        (err, agendamentos) => {
          res.render('agendamento', {
            usuario,
            precos: PRECOS,
            agendamentos: agendamentos || [],
            query: req.query,
            diasOcupados: diasFormatados
          });
        }
      );
    }
  );
});

app.post('/agendamento', requireAuth, (req, res) => {
  const { data, cortes, pagamento, nome_cliente, telefone } = req.body;
  const usuario = req.session.usuario;
  
  // Processar cortes selecionados
  const cortesSelecionados = Array.isArray(cortes) ? cortes : [cortes];
  const nomesCortes = cortesSelecionados.map(c => PRECOS[c]?.nome || c).join(', ');
  
  // Calcular preço total
  const precoTotal = cortesSelecionados.reduce((total, corte) => {
    return total + (PRECOS[corte]?.preco || 0);
  }, 0);
  
  db.run(
    `INSERT INTO agendamentos 
    (usuario_id, nome_cliente, telefone, data_agendamento, cortes, pagamento, preco_total, status) 
    VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmado')`,
    [usuario.id, nome_cliente || usuario.nome, telefone || usuario.telefone, data, nomesCortes, pagamento, precoTotal],
    function(err) {
      if (err) {
        console.error('Erro ao criar agendamento:', err);
        return res.redirect('/agendamento?erro=1');
      }
      res.redirect('/agendamento?sucesso=1');
    }
  );
});

// Painel Admin
app.get('/admin', requireAdmin, (req, res) => {
  db.all(
    'SELECT a.*, u.nome as nome_usuario, u.telefone as tel_usuario FROM agendamentos a JOIN usuarios u ON a.usuario_id = u.id ORDER BY a.data_agendamento ASC',
    (err, agendamentos) => {
      db.all('SELECT COUNT(*) as total FROM agendamentos', (err, count) => {
        res.render('admin', {
          usuario: req.session.usuario,
          agendamentos: agendamentos || [],
          totalAgendamentos: count[0]?.total || 0
        });
      });
    }
  );
});

app.post('/admin/cancelar/:id', requireAdmin, (req, res) => {
  db.run('UPDATE agendamentos SET status = "cancelado" WHERE id = ?', [req.params.id], (err) => {
    res.redirect('/admin');
  });
});

app.post('/admin/confimar/:id', requireAdmin, (req, res) => {
  db.run('UPDATE agendamentos SET status = "confirmado" WHERE id = ?', [req.params.id], (err) => {
    res.redirect('/admin');
  });
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// Criar admin padrão (se não existir)
db.get('SELECT * FROM usuarios WHERE is_admin = 1', (err, admin) => {
  if (!admin) {
    const senhaAdmin = bcrypt.hashSync('admin123', 10);
    db.run(
      'INSERT INTO usuarios (nome, telefone, email, senha, is_admin) VALUES (?, ?, ?, ?, ?)',
      ['Administrador', '11999999999', 'admin@barbeariabueno.com.br', senhaAdmin, 1],
      (err) => {
        console.log('✓ Admin padrão criado: admin@barbeariabueno.com.br / admin123');
      }
    );
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════╗
║                                                   ║
║   🍃 BARBEARIA BUENO - SERVIDOR INICIADO 🍃      ║
║                                                   ║
║   🌐 Acesse: http://localhost:${PORT}              ║
║                                                   ║
║   📧 Admin: admin@barbeariabueno.com.br           ║
║   🔑 Senha: admin123                              ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
  `);
});

