# Agenda-c-lios-import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Phone, Check, X, Copy, MessageCircle } from 'lucide-react';

export default function AgendaCilios() {
  const [aba, setAba] = useState('agendar'); // 'agendar', 'painel' ou 'consultar'
  const [agendamentos, setAgendamentos] = useState([]);
  const [horariosSelecionados, setHorariosSelecionados] = useState({});

  // Dados do formulário de agendamento
  const [formulario, setFormulario] = useState({
    nome: '',
    telefone: '',
    data: '',
    horario: ''
  });

  // Dados para consultar status
  const [consultarNome, setConsultarNome] = useState('');
  const [consultarTelefone, setConsultarTelefone] = useState('');
  const [resultadoConsulta, setResultadoConsulta] = useState(null);
  const [mostraResultado, setMostraResultado] = useState(false);
  const [mostraCodigoConfirmacao, setMostraCodigoConfirmacao] = useState(false);
  const [ultimoCodigoAgendamento, setUltimoCodigoAgendamento] = useState('');

  // Dados da proprietária
  const [whatsappProprietaria, setWhatsappProprietaria] = useState('');
  const [mostraModalWhatsapp, setMostraModalWhatsapp] = useState(false);

  // Carregar dados do localStorage
  useEffect(() => {
    const dados = localStorage.getItem('agendaCilios');
    if (dados) {
      const parsed = JSON.parse(dados);
      setAgendamentos(parsed.agendamentos || []);
      setWhatsappProprietaria(parsed.whatsapp || '');
    }
  }, []);

  // Salvar dados no localStorage
  useEffect(() => {
    localStorage.setItem('agendaCilios', JSON.stringify({
      agendamentos,
      whatsapp: whatsappProprietaria
    }));
  }, [agendamentos, whatsappProprietaria]);

  // Gerar código único
  const gerarCodigoUnico = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  // Consultar status do agendamento
  const consultarStatus = () => {
    if (!consultarNome || !consultarTelefone) {
      alert('Por favor, preencha nome e telefone!');
      return;
    }

    const telefoneLimpo = consultarTelefone.replace(/\D/g, '');
    const agendamento = agendamentos.find(
      a => a.nome.toLowerCase() === consultarNome.toLowerCase() && 
           a.telefone.replace(/\D/g, '') === telefoneLimpo
    );

    if (agendamento) {
      setResultadoConsulta(agendamento);
      setMostraResultado(true);
    } else {
      alert('Nenhum agendamento encontrado com esses dados. Tente novamente!');
      setMostraResultado(false);
    }
  };

  // Gerar horários disponíveis
  const gerarHorariosDisponiveis = (dataSelecionada) => {
    const horarios = [];
    const data = new Date(dataSelecionada);
    const diaSemana = data.getDay();

    // Verifica se é segunda (1) a sábado (6)
    if (diaSemana === 0 || diaSemana === 7) {
      return [];
    }

    // Gera horários de 1h30 em 1h30
    for (let hora = 9; hora < 20; hora++) {
      for (let minutos = 0; minutos < 60; minutos += 90) {
        if (hora * 60 + minutos < 20 * 60) {
          const horarioStr = `${hora.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
          
          // Verifica se o horário já está agendado
          const estaAgendado = agendamentos.some(a => 
            a.data === dataSelecionada && a.horario === horarioStr && a.status !== 'rejeitado'
          );

          if (!estaAgendado) {
            horarios.push(horarioStr);
          }
        }
      }
    }

    return horarios;
  };

  // Validar telefone (apenas números)
  const formatarTelefone = (valor) => {
    return valor.replace(/\D/g, '');
  };

  // Enviar agendamento
  const enviarAgendamento = () => {
    if (!formulario.nome || !formulario.telefone || !formulario.data || !formulario.horario) {
      alert('Por favor, preencha todos os campos!');
      return;
    }

    const novoAgendamento = {
      id: Date.now(),
      codigo: gerarCodigoUnico(),
      nome: formulario.nome,
      telefone: formulario.telefone,
      data: formulario.data,
      horario: formulario.horario,
      status: 'pendente',
      dataCriacao: new Date().toLocaleString('pt-BR')
    };

    setAgendamentos([...agendamentos, novoAgendamento]);
    setUltimoCodigoAgendamento(novoAgendamento.codigo);
    setMostraCodigoConfirmacao(true);
    
    // Limpar formulário
    setFormulario({ nome: '', telefone: '', data: '', horario: '' });
  };

  // Confirmar agendamento
  const confirmarAgendamento = (id) => {
    const agendamento = agendamentos.find(a => a.id === id);
    if (agendamento) {
      setAgendamentos(agendamentos.map(a =>
        a.id === id ? { ...a, status: 'confirmado' } : a
      ));
    }
  };

  // Rejeitar agendamento
  const rejeitarAgendamento = (id) => {
    setAgendamentos(agendamentos.map(a =>
      a.id === id ? { ...a, status: 'rejeitado' } : a
    ));
  };

  // Gerar mensagem WhatsApp
  const gerarMensagemWhatsApp = (agendamento, confirmado = true) => {
    const data = new Date(agendamento.data);
    const dataFormatada = data.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    
    if (confirmado) {
      return `Olá ${agendamento.nome}! 💅 Seu agendamento para cílios foi CONFIRMADO! 
📅 Data: ${dataFormatada}
🕐 Horário: ${agendamento.horario}
⏱️ Duração: 1h30 a 2h

Qualquer dúvida, estou por aqui! 😊`;
    } else {
      return `Olá ${agendamento.nome}, infelizmente não consegui agendar seu horário de cílios para ${dataFormatada} às ${agendamento.horario}. 
Por favor, escolha outro horário disponível. Obrigada! 💅`;
    }
  };

  // Copiar mensagem para WhatsApp
  const copiarParaWhatsApp = (agendamento, confirmado = true) => {
    const mensagem = gerarMensagemWhatsApp(agendamento, confirmado);
    const numero = agendamento.telefone.replace(/\D/g, '');
    const texto = encodeURIComponent(mensagem);
    const urlWhatsApp = `https://wa.me/55${numero}?text=${texto}`;
    window.open(urlWhatsApp, '_blank');
  };

  // Horários disponíveis para o formulário
  const horariosDisponiveis = formulario.data ? gerarHorariosDisponiveis(formulario.data) : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-500 to-purple-500 text-white p-6 shadow-lg">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-8 h-8" />
            <h1 className="text-3xl font-bold">Agenda de Cílios</h1>
          </div>
          <p className="text-pink-100">Gerencie seus agendamentos com facilidade</p>
        </div>
      </div>

      {/* Abas */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex gap-4 mb-8 flex-wrap">
          <button
            onClick={() => setAba('agendar')}
            className={`px-8 py-3 rounded-lg font-semibold transition ${
              aba === 'agendar'
                ? 'bg-pink-500 text-white shadow-lg'
                : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-pink-300'
            }`}
          >
            📅 Agendar Horário
          </button>
          <button
            onClick={() => setAba('consultar')}
            className={`px-8 py-3 rounded-lg font-semibold transition ${
              aba === 'consultar'
                ? 'bg-pink-500 text-white shadow-lg'
                : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-pink-300'
            }`}
          >
            🔍 Consultar Agendamento
          </button>
          <button
            onClick={() => setAba('painel')}
            className={`px-8 py-3 rounded-lg font-semibold transition ${
              aba === 'painel'
                ? 'bg-pink-500 text-white shadow-lg'
                : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-pink-300'
            }`}
          >
            ⚙️ Painel de Gerenciamento ({agendamentos.filter(a => a.status === 'pendente').length})
          </button>
        </div>

        {/* MODAL DE CONFIRMAÇÃO COM CÓDIGO */}
        {mostraCodigoConfirmacao && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md mx-4">
              <div className="text-center">
                <div className="text-6xl mb-4">🎉</div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">Agendamento Realizado!</h3>
                <p className="text-gray-600 mb-6">Seu agendamento foi enviado para confirmação!</p>
                
                <div className="bg-gradient-to-r from-pink-100 to-purple-100 rounded-xl p-6 mb-6">
                  <p className="text-sm text-gray-600 mb-2">Seu código:</p>
                  <p className="text-4xl font-bold text-pink-600 tracking-wider">{ultimoCodigoAgendamento}</p>
                  <p className="text-xs text-gray-500 mt-2">Guarde esse código!</p>
                </div>

                <div className="bg-blue-50 rounded-lg p-4 mb-6 text-left">
                  <p className="text-sm font-semibold text-blue-900 mb-2">📱 O que fazer agora:</p>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>✅ Você receberá em breve no WhatsApp</li>
                    <li>✅ A confirmação será enviada em poucas horas</li>
                    <li>✅ Volte aqui para consultar o status</li>
                  </ul>
                </div>

                <button
                  onClick={() => {
                    setMostraCodigoConfirmacao(false);
                    setAba('consultar');
                  }}
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white py-3 rounded-lg font-bold hover:shadow-lg transition mb-3"
                >
                  ✓ Consultar Status
                </button>
                
                <button
                  onClick={() => setMostraCodigoConfirmacao(false)}
                  className="w-full bg-gray-200 text-gray-800 py-3 rounded-lg font-bold hover:bg-gray-300 transition"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ABA AGENDAR */}
        {aba === 'agendar' && (
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl">
            <h2 className="text-2xl font-bold text-gray-800 mb-8">Agende seu Horário</h2>

            <div className="space-y-6">
              {/* Nome */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <User className="inline w-4 h-4 mr-2" />
                  Seu Nome
                </label>
                <input
                  type="text"
                  placeholder="Digite seu nome completo"
                  value={formulario.nome}
                  onChange={(e) => setFormulario({ ...formulario, nome: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:outline-none"
                />
              </div>

              {/* Telefone */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Phone className="inline w-4 h-4 mr-2" />
                  Seu WhatsApp
                </label>
                <input
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={formulario.telefone}
                  onChange={(e) => setFormulario({ ...formulario, telefone: formatarTelefone(e.target.value) })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:outline-none"
                />
              </div>

              {/* Data */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Calendar className="inline w-4 h-4 mr-2" />
                  Data Desejada
                </label>
                <input
                  type="date"
                  value={formulario.data}
                  onChange={(e) => setFormulario({ ...formulario, data: e.target.value, horario: '' })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:outline-none"
                />
                {formulario.data && new Date(formulario.data).getDay() === 0 && (
                  <p className="text-red-500 text-sm mt-2">❌ Não atendemos aos domingos</p>
                )}
              </div>

              {/* Horário */}
              {formulario.data && new Date(formulario.data).getDay() !== 0 && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Clock className="inline w-4 h-4 mr-2" />
                    Horário Disponível
                  </label>
                  {horariosDisponiveis.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {horariosDisponiveis.map((h) => (
                        <button
                          key={h}
                          onClick={() => setFormulario({ ...formulario, horario: h })}
                          className={`py-2 px-3 rounded-lg font-semibold transition ${
                            formulario.horario === h
                              ? 'bg-pink-500 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {h}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-red-500">❌ Nenhum horário disponível nesta data</p>
                  )}
                </div>
              )}

              {/* Botão Enviar */}
              <button
                onClick={enviarAgendamento}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white py-3 rounded-lg font-bold text-lg hover:shadow-lg transition mt-8"
              >
                Confirmar Agendamento ✓
              </button>
            </div>
          </div>
        )}

        {/* ABA CONSULTAR */}
        {aba === 'consultar' && (
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl">
            <h2 className="text-2xl font-bold text-gray-800 mb-8">Consultar Seu Agendamento</h2>

            <div className="space-y-6">
              {/* Nome */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <User className="inline w-4 h-4 mr-2" />
                  Seu Nome
                </label>
                <input
                  type="text"
                  placeholder="Digite seu nome"
                  value={consultarNome}
                  onChange={(e) => setConsultarNome(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:outline-none"
                />
              </div>

              {/* Telefone */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Phone className="inline w-4 h-4 mr-2" />
                  Seu WhatsApp
                </label>
                <input
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={consultarTelefone}
                  onChange={(e) => setConsultarTelefone(formatarTelefone(e.target.value))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:outline-none"
                />
              </div>

              {/* Botão Consultar */}
              <button
                onClick={consultarStatus}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white py-3 rounded-lg font-bold text-lg hover:shadow-lg transition mt-8"
              >
                🔍 Consultar Status
              </button>
            </div>

            {/* Resultado da Consulta */}
            {mostraResultado && resultadoConsulta && (
              <div className="mt-8 pt-8 border-t-2 border-gray-200">
                <h3 className="text-xl font-bold text-gray-800 mb-6">Resultado da Consulta</h3>
                
                {resultadoConsulta.status === 'pendente' && (
                  <div className="bg-yellow-50 rounded-xl p-6 border-l-4 border-yellow-500">
                    <div className="flex items-start gap-4">
                      <div className="text-4xl">⏳</div>
                      <div className="flex-1">
                        <p className="font-bold text-yellow-900 text-lg mb-2">Agendamento Pendente</p>
                        <p className="text-yellow-800 mb-4">Sua solicitação de agendamento está sendo analisada!</p>
                        <div className="bg-white rounded-lg p-4 space-y-2">
                          <p className="text-sm"><strong>Nome:</strong> {resultadoConsulta.nome}</p>
                          <p className="text-sm"><strong>Data Solicitada:</strong> {new Date(resultadoConsulta.data).toLocaleDateString('pt-BR')}</p>
                          <p className="text-sm"><strong>Horário Solicitado:</strong> {resultadoConsulta.horario}</p>
                          <p className="text-sm"><strong>Enviado em:</strong> {resultadoConsulta.dataCriacao}</p>
                        </div>
                        <p className="text-yellow-700 text-sm mt-4">💬 Você receberá em breve uma mensagem de confirmação via WhatsApp!</p>
                      </div>
                    </div>
                  </div>
                )}

                {resultadoConsulta.status === 'confirmado' && (
                  <div className="bg-green-50 rounded-xl p-6 border-l-4 border-green-500">
                    <div className="flex items-start gap-4">
                      <div className="text-4xl">✅</div>
                      <div className="flex-1">
                        <p className="font-bold text-green-900 text-lg mb-2">Agendamento Confirmado!</p>
                        <p className="text-green-800 mb-4">Sua sessão de cílios foi confirmada com sucesso!</p>
                        <div className="bg-white rounded-lg p-4 space-y-3">
                          <div>
                            <p className="text-xs text-gray-500">CLIENTE</p>
                            <p className="text-sm font-semibold text-gray-800">{resultadoConsulta.nome}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">DATA</p>
                            <p className="text-lg font-bold text-green-600">{new Date(resultadoConsulta.data).toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">HORÁRIO</p>
                            <p className="text-lg font-bold text-green-600">{resultadoConsulta.horario}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">DURAÇÃO</p>
                            <p className="text-sm text-gray-800">1h30 a 2h</p>
                          </div>
                        </div>
                        <div className="bg-green-100 rounded-lg p-4 mt-4">
                          <p className="text-green-900 font-semibold mb-2">✨ Informações importantes:</p>
                          <ul className="text-sm text-green-800 space-y-1">
                            <li>✓ Chegue 5 minutos antes</li>
                            <li>✓ Qualquer dúvida, envie mensagem</li>
                            <li>✓ Confirme sua presença 24h antes</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {resultadoConsulta.status === 'rejeitado' && (
                  <div className="bg-red-50 rounded-xl p-6 border-l-4 border-red-500">
                    <div className="flex items-start gap-4">
                      <div className="text-4xl">❌</div>
                      <div className="flex-1">
                        <p className="font-bold text-red-900 text-lg mb-2">Agendamento Não Confirmado</p>
                        <p className="text-red-800 mb-4">Infelizmente, o horário solicitado não pôde ser confirmado.</p>
                        <div className="bg-white rounded-lg p-4 space-y-2 mb-4">
                          <p className="text-sm"><strong>Data Solicitada:</strong> {new Date(resultadoConsulta.data).toLocaleDateString('pt-BR')}</p>
                          <p className="text-sm"><strong>Horário Solicitado:</strong> {resultadoConsulta.horario}</p>
                        </div>
                        <div className="bg-red-100 rounded-lg p-4">
                          <p className="text-red-900 font-semibold mb-2">💡 O que fazer?</p>
                          <p className="text-sm text-red-800 mb-3">Tente agendar em outra data ou horário disponível. Volte à primeira aba e escolha outro agendamento!</p>
                          <button
                            onClick={() => {
                              setAba('agendar');
                              setMostraResultado(false);
                              setConsultarNome('');
                              setConsultarTelefone('');
                            }}
                            className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-semibold transition"
                          >
                            Tentar Outro Horário
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ABA PAINEL */}
        {aba === 'painel' && (
          <div className="space-y-6">
            {/* Modal WhatsApp */}
            {mostraModalWhatsapp && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-2xl p-8 max-w-md">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Configurar WhatsApp</h3>
                  <p className="text-gray-600 mb-4">Digite seu número WhatsApp para receber notificações de novos agendamentos:</p>
                  <input
                    type="tel"
                    placeholder="(11) 99999-9999"
                    value={whatsappProprietaria}
                    onChange={(e) => setWhatsappProprietaria(formatarTelefone(e.target.value))}
                    className="w-full px-4 py-2 border-2 border-pink-300 rounded-lg mb-4 focus:border-pink-500 focus:outline-none"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => setMostraModalWhatsapp(false)}
                      className="flex-1 bg-gray-300 text-gray-800 py-2 rounded-lg font-semibold hover:bg-gray-400"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => setMostraModalWhatsapp(false)}
                      className="flex-1 bg-pink-500 text-white py-2 rounded-lg font-semibold hover:bg-pink-600"
                    >
                      Salvar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Botão Configurar WhatsApp */}
            <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageCircle className="w-6 h-6 text-blue-600" />
                <div>
                  <p className="font-semibold text-blue-900">WhatsApp Configurado</p>
                  <p className="text-sm text-blue-700">{whatsappProprietaria ? `+55${whatsappProprietaria}` : 'Clique para configurar'}</p>
                </div>
              </div>
              <button
                onClick={() => setMostraModalWhatsapp(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700"
              >
                {whatsappProprietaria ? 'Editar' : 'Configurar'}
              </button>
            </div>

            {/* Agendamentos Pendentes */}
            <div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                ⏳ Agendamentos Pendentes ({agendamentos.filter(a => a.status === 'pendente').length})
              </h3>

              {agendamentos.filter(a => a.status === 'pendente').length === 0 ? (
                <div className="bg-white rounded-xl p-8 text-center text-gray-500">
                  <Calendar className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg">Nenhum agendamento pendente 🎉</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {agendamentos
                    .filter(a => a.status === 'pendente')
                    .sort((a, b) => new Date(a.data) - new Date(b.data))
                    .map((agendamento) => (
                      <div key={agendamento.id} className="bg-white rounded-xl p-6 shadow-md border-l-4 border-yellow-500">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-gray-500">Cliente</p>
                            <p className="font-bold text-lg text-gray-800">{agendamento.nome}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">WhatsApp</p>
                            <p className="font-bold text-gray-800">{agendamento.telefone}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Data</p>
                            <p className="font-bold text-gray-800">
                              {new Date(agendamento.data).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Horário</p>
                            <p className="font-bold text-gray-800">{agendamento.horario}</p>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <button
                            onClick={() => confirmarAgendamento(agendamento.id)}
                            className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition"
                          >
                            <Check className="w-5 h-5" />
                            Confirmar
                          </button>
                          <button
                            onClick={() => rejeitarAgendamento(agendamento.id)}
                            className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition"
                          >
                            <X className="w-5 h-5" />
                            Rejeitar
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Agendamentos Confirmados */}
            {agendamentos.filter(a => a.status === 'confirmado').length > 0 && (
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">
                  ✅ Agendamentos Confirmados ({agendamentos.filter(a => a.status === 'confirmado').length})
                </h3>
                <div className="space-y-4">
                  {agendamentos
                    .filter(a => a.status === 'confirmado')
                    .sort((a, b) => new Date(a.data) - new Date(b.data))
                    .map((agendamento) => (
                      <div key={agendamento.id} className="bg-green-50 rounded-xl p-6 border-l-4 border-green-500">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-gray-600">Cliente</p>
                            <p className="font-bold text-gray-800">{agendamento.nome}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Data/Horário</p>
                            <p className="font-bold text-gray-800">
                              {new Date(agendamento.data).toLocaleDateString('pt-BR')} às {agendamento.horario}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => copiarParaWhatsApp(agendamento, true)}
                          className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition"
                        >
                          <MessageCircle className="w-5 h-5" />
                          Enviar Mensagem de Confirmação
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Agendamentos Rejeitados */}
            {agendamentos.filter(a => a.status === 'rejeitado').length > 0 && (
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">
                  ❌ Agendamentos Rejeitados ({agendamentos.filter(a => a.status === 'rejeitado').length})
                </h3>
                <div className="space-y-4">
                  {agendamentos
                    .filter(a => a.status === 'rejeitado')
                    .sort((a, b) => new Date(b.data) - new Date(a.data))
                    .map((agendamento) => (
                      <div key={agendamento.id} className="bg-red-50 rounded-xl p-6 border-l-4 border-red-500">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-gray-600">Cliente</p>
                            <p className="font-bold text-gray-800">{agendamento.nome}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Data/Horário Solicitado</p>
                            <p className="font-bold text-gray-800">
                              {new Date(agendamento.data).toLocaleDateString('pt-BR')} às {agendamento.horario}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => copiarParaWhatsApp(agendamento, false)}
                          className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition"
                        >
                          <MessageCircle className="w-5 h-5" />
                          Enviar Mensagem de Rejeição
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
    }
