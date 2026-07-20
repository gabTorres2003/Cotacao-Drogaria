import { useEffect, useState } from 'react'
import api from '../services/api'
import Sidebar from '../components/layout/Sidebar'
import {
  UserPlus,
  Phone,
  Trash2,
  Search,
  User,
  Pencil,
  KeyRound,
  MessageCircle,
} from 'lucide-react'

export default function Fornecedores() {
  const [fornecedores, setFornecedores] = useState([])
  const [modalAberto, setModalAberto] = useState(false)
  const [form, setForm] = useState({
    id: null,
    nome: '',
    telefone: '',
    login: '',
    email: '',
    senha: '',
  })

  const [busca, setBusca] = useState('')

  useEffect(() => {
    carregarFornecedores()
  }, [])

  const carregarFornecedores = async () => {
    try {
      const response = await api.get('/api/fornecedor')
      setFornecedores(response.data)
    } catch (error) {
      console.error('Erro ao listar fornecedores', error)
    }
  }

  const abrirModalCriacao = () => {
    setForm({
      id: null,
      nome: '',
      telefone: '',
      login: '',
      email: '',
      senha: '',
    })
    setModalAberto(true)
  }

  const abrirModalEdicao = (fornecedor) => {
    setForm({
      id: fornecedor.id,
      nome: fornecedor.nome,
      telefone: fornecedor.telefone || '',
      login: fornecedor.login || '',
      email: fornecedor.email || '',
      senha: '',
    })
    setModalAberto(true)
  }

  const handleResetSenha = async (id, nome) => {
    const novoPin = window.prompt(
      `Defina um novo PIN (4 a 6 dígitos) de primeiro acesso para o fornecedor: ${nome}`,
    )

    if (novoPin === null) return

    if (!/^\d{4,6}$/.test(novoPin)) {
      alert('O PIN deve conter apenas números, entre 4 e 6 dígitos.')
      return
    }

    try {
      await api.put(`/api/fornecedor/${id}/reset-senha`, { novaSenha: novoPin })
      alert(
        'Senha resetada com sucesso! O fornecedor precisará trocá-la no próximo acesso.',
      )
      carregarFornecedores()
    } catch (error) {
      alert('Erro ao resetar senha.')
    }
  }

  const handleExcluir = async (id, nome) => {
    if (
      window.confirm(`Tem certeza que deseja excluir o fornecedor ${nome}?`)
    ) {
      try {
        await api.delete(`/api/fornecedor/${id}`)
        alert('Fornecedor excluído com sucesso!')
        carregarFornecedores()
      } catch (error) {
        alert(
          error.response?.data ||
            'Erro ao excluir fornecedor. Ele já pode estar vinculado a respostas de cotações passadas.',
        )
      }
    }
  }

  const handleCompartilharWhatsApp = (fornecedor) => {
    const numeroLimpo = fornecedor.telefone
      ? fornecedor.telefone.replace(/\D/g, '')
      : ''

    if (!numeroLimpo || numeroLimpo.length < 10) {
      alert('O fornecedor não possui um número de telefone válido cadastrado.')
      return
    }

    const telefoneFinal = numeroLimpo.startsWith('55')
      ? numeroLimpo
      : `55${numeroLimpo}`
    const linkSistema = 'https://cotacaotorresfarma.netlify.app'
    const mensagem = `Olá, somos da *Drogaria Torres Farma*! 💊\n\nSegue o seu acesso ao nosso novo Portal de Cotações:\n\n🌐 *Link:* ${linkSistema}\n👤 *Login:* ${fornecedor.login}\n🔑 *Senha:* (a senha inicial fornecida no momento do cadastro)\n\n*Atenção:* No seu primeiro acesso, o sistema pedirá para você criar uma senha própria de segurança.\n\nQualquer dúvida, estamos à disposição!`
    const mensagemCodificada = encodeURIComponent(mensagem)
    const urlWhatsapp = `https://wa.me/${telefoneFinal}?text=${mensagemCodificada}`

    window.open(urlWhatsapp, '_blank')
  }

  const handleSalvar = async (e) => {
    e.preventDefault()
    if (
      !form.nome ||
      !form.telefone ||
      !form.login ||
      (!form.id && !form.senha)
    ) {
      alert('Preencha todos os campos obrigatórios!')
      return
    }

    if (!form.id && !/^\d{4,6}$/.test(form.senha)) {
      alert('O PIN deve ter entre 4 e 6 números.')
      return
    }

    try {
      const telefoneLimpo = form.telefone.replace(/\D/g, '')
      const payload = {
        nome: form.nome,
        telefone: telefoneLimpo,
        login: form.login,
        email: form.email,
        senha: form.senha,
      }

      if (form.id) {
        await api.put(`/api/fornecedor/${form.id}`, payload)
        alert('Fornecedor atualizado com sucesso!')
      } else {
        await api.post('/api/fornecedor', payload)
        alert('Fornecedor cadastrado com sucesso!')
      }

      setModalAberto(false)
      carregarFornecedores()
    } catch (error) {
      alert('Erro ao salvar: ' + (error.response?.data || error.message))
    }
  }

  const filtrados = fornecedores.filter(
    (f) =>
      f.nome.toLowerCase().includes(busca.toLowerCase()) ||
      (f.telefone && f.telefone.includes(busca)) ||
      (f.login && f.login.toLowerCase().includes(busca.toLowerCase())),
  )

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '30px',
          }}
        >
          <div>
            <h1 style={{ fontSize: '24px', marginBottom: '5px' }}>
              Gerenciar Fornecedores
            </h1>
            <p style={{ color: '#6b7280' }}>
              Cadastre os contatos e os acessos (login) para envio de cotações
            </p>
          </div>

          <button className="btn-new-cotacao" onClick={abrirModalCriacao}>
            <UserPlus size={20} /> Novo Fornecedor
          </button>
        </header>

        <div className="filters-bar">
          <div className="search-input-container">
            <Search size={18} color="#9ca3af" />
            <input
              type="text"
              placeholder="Buscar fornecedor por nome, login ou telefone..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th style={{ width: '60px' }}>ID</th>
                <th>Nome / Login</th>
                <th>Telefone (WhatsApp)</th>
                <th style={{ width: '120px' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    style={{
                      textAlign: 'center',
                      padding: '20px',
                      color: '#888',
                    }}
                  >
                    Nenhum fornecedor encontrado.
                  </td>
                </tr>
              ) : (
                filtrados.map((f) => (
                  <tr key={f.id}>
                    <td>#{f.id}</td>
                    <td>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        <div
                          style={{
                            background: '#e0f2fe',
                            padding: '8px',
                            borderRadius: '50%',
                            color: '#0284c7',
                          }}
                        >
                          <User size={16} />
                        </div>
                        <div>
                          <div style={{ fontWeight: '600', color: '#374151' }}>
                            {f.nome}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>
                            Login: {f.login}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          color: '#666',
                        }}
                      >
                        <Phone size={16} />
                        {f.telefone || 'Sem telefone'}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn-icon"
                          style={{ color: '#2563eb', background: '#eff6ff' }}
                          title="Editar"
                          onClick={() => abrirModalEdicao(f)}
                        >
                          <Pencil size={18} />
                        </button>

                        <button
                          className="btn-icon"
                          style={{ color: '#d97706', background: '#fef3c7' }}
                          title="Resetar Senha"
                          onClick={() => handleResetSenha(f.id, f.nome)}
                        >
                          <KeyRound size={18} />
                        </button>

                        {/* BOTÃO EXCLUIR ATIVADO */}
                        <button
                          className="btn-icon"
                          style={{ color: '#ef4444', background: '#fef2f2' }}
                          title="Excluir"
                          onClick={() => handleExcluir(f.id, f.nome)}
                        >
                          <Trash2 size={18} />
                        </button>

                        {/* Botão de WhatsApp */}
                        <button
                          onClick={() => handleCompartilharWhatsApp(f)}
                          title="Enviar Acesso pelo WhatsApp"
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#25D366', 
                            marginRight: '12px',
                            padding: '4px',
                          }}
                        >
                          <MessageCircle size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      {modalAberto && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h2 style={{ marginBottom: '20px' }}>
              {form.id ? 'Editar Fornecedor' : 'Novo Fornecedor'}
            </h2>

            <form
              onSubmit={handleSalvar}
              style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}
            >
              <div>
                <label style={styles.label}>Nome da Empresa / Vendedor *</label>
                <input
                  type="text"
                  style={styles.input}
                  required
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  placeholder="Ex: Distribuidora Santa Cruz"
                />
              </div>

              <div>
                <label style={styles.label}>WhatsApp (com DDD) *</label>
                <input
                  type="tel"
                  style={styles.input}
                  required
                  value={form.telefone}
                  onChange={(e) =>
                    setForm({ ...form, telefone: e.target.value })
                  }
                  placeholder="Ex: 5522999999999"
                />
              </div>

              <div style={{ borderTop: '1px solid #eee', paddingTop: '15px' }}>
                <label style={styles.label}>Login de Acesso *</label>
                <input
                  type="text"
                  style={styles.input}
                  required
                  value={form.login}
                  onChange={(e) => setForm({ ...form, login: e.target.value })}
                  placeholder="nomedovendedor"
                />
              </div>

              <div>
                <label style={styles.label}>E-mail (Opcional)</label>
                <input
                  type="email"
                  style={styles.input}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="vendedor@distribuidora.com"
                />
              </div>

              {!form.id && (
                <div>
                  <label style={styles.label}>
                    PIN de Acesso (4 a 6 dígitos) *
                  </label>
                  <input
                    type="text"
                    style={styles.input}
                    required
                    value={form.senha}
                    onChange={(e) =>
                      setForm({ ...form, senha: e.target.value })
                    }
                    placeholder="Ex: 1234"
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  style={styles.btnCancel}
                >
                  Cancelar
                </button>
                <button type="submit" style={styles.btnSave}>
                  {form.id ? 'Salvar Alterações' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '400px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    marginBottom: '5px',
    display: 'block',
    color: '#374151',
  },
  input: {
    width: '100%',
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    fontSize: '15px',
    outlineColor: '#2563eb',
  },
  btnCancel: {
    flex: 1,
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    background: 'white',
    cursor: 'pointer',
    fontWeight: '500',
    color: '#374151',
  },
  btnSave: {
    flex: 1,
    padding: '12px',
    borderRadius: '8px',
    border: 'none',
    background: '#2563eb',
    color: 'white',
    fontWeight: '600',
    cursor: 'pointer',
  },
}
