import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Phone, Check, X, Copy, MessageCircle } from 'lucide-react';

export default function AgendaCilios() {
  const [aba, setAba] = useState('agendar');
  const [agendamentos, setAgendamentos] = useState([]);
  const [horariosSelecionados, setHorariosSelecionados] = useState({});

  const [formulario, setFormulario] = useState({
    nome: '',
    telefone: '',
    data: '',
    horario: ''
  });

  const [consultarNome, setConsultarNome] = useState('');
  const [consultarTelefone, setConsultarTelefone] = useState('');
  const [resultadoConsulta, setResultadoConsulta] = useState(null);
  const [mostraResultado, setMostraResultado] = useState(false);
  const [mostraCodigoConfirmacao, setMostraCodigoConfirmacao] = useState(false);
  const [ultimoCodigoAgendamento, setUltimoCodigoAgendamento] = useState('');

  const [whatsappProprietaria, setWhatsappProprietaria] = useState('');
  const [mostraModalWhatsapp, setMostraModalWhatsapp] = useState(false);

  useEffect(() => {
    const dados = localStorage.getItem('agendaCilios');
    if (dados) {
      const parsed = JSON.parse(dados);
      setAgendamentos(parsed.agendamentos || []);
      setWhatsappProprietaria(parsed.whatsapp || '');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('agendaCilios', JSON.stringify({
      agendamentos,
      whatsapp: whatsappProprietaria
    }));
  }, [agendamentos, whatsappProprietaria]);

  const gerarCodigoUnico = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

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

  const gerarHorariosDisponiveis = (dataSelecionada) => {
    const horarios = [];
    const data = new Date(dataSelecionada);
    const diaSemana = data.getDay();

    if (diaSemana === 0 || diaSemana === 7) {
      return [];
    }

    for (let hora = 9; hora < 20; hora++) {
      for (let minutos = 0; minutos < 60; minutos += 90) {
        if (hora * 60 + minutos < 20 * 60) {
          const horarioStr = `${hora.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
          
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

  const formatarTelefone = (valor) => {
    return valor.replace(/\D/g, '');
  };

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
    
    setFormulario({ nome: '', telefone: '', data: '', horario: '' });
  };

  const confirmarAgendamento = (id) => {
    const agendamento = agendamentos.find(a => a.id === id);
    if (agendamento) {
      setAgendamentos(agendamentos.map(a =>
        a.id === id ? { ...a, status: 'confirmado' } : a
      ));
    }
  };

  const rejeitarAgendamento = (id) => {
    setAgendamentos(agendamentos.map(a =>
      a.id === id ? { ...a, status: 'rejeitado' } : a
    ));
  };

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
