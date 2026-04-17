import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Stethoscope, Heart, AlertCircle } from '../icons';
import { usePatientMoment, type PatientMoment } from '../hooks/usePatientMoment';
import { GuidedConversation } from './GuidedConversation';
import { getStatusConfig, getCountdownLabel, getCountdownColor } from '../constants/statusConfig';

interface PatientPortalHomeProps {
  patient: {
    name: string;
    photo_url: string;
  };
  clinic: {
    name?: string;
    clinic_name?: string;
    photo_url?: string;
  } | null;
  futureAppointments: Array<{
    id: number;
    start_time: string;
    end_time: string;
    status: string;
    notes: string;
    dentist_name: string;
  }>;
  recentProcedures: Array<{
    date: string;
    procedure: string;
    category: string;
  }>;
  onOpenDepth: () => void;
  onConfirmAppointment: (id: number) => void;
  onRescheduleAppointment: (apt: any) => void;
  appointmentSubmittingId: number | null;
  confirmedAppointmentId: number | null;
  rescheduleRequestedAppointmentId: number | null;
  sessionToken: string | null;
}

export function PatientPortalHome({
  patient,
  clinic,
  futureAppointments,
  recentProcedures,
  onOpenDepth,
  onConfirmAppointment,
  onRescheduleAppointment,
  appointmentSubmittingId,
  confirmedAppointmentId,
  rescheduleRequestedAppointmentId,
  sessionToken,
}: PatientPortalHomeProps) {
  const moment = usePatientMoment({ futureAppointments, recentProcedures });
  const [showGuidedConversation, setShowGuidedConversation] = useState(false);
  const [isSubmittingSchedule, setIsSubmittingSchedule] = useState(false);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const formatDateBR = (d: string) => {
    try {
      return new Date(d).toLocaleDateString('pt-BR');
    } catch {
      return d;
    }
  };

  const formatTimeBR = (d: string) => {
    try {
      return new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const getConfirmationQuestion = (appointmentDate: string) => {
    const date = new Date(appointmentDate);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    const isSameDay = (left: Date, right: Date) =>
      left.getFullYear() === right.getFullYear() &&
      left.getMonth() === right.getMonth() &&
      left.getDate() === right.getDate();

    const dayLabel = isSameDay(date, today)
      ? 'hoje'
      : isSameDay(date, tomorrow)
      ? 'amanhã'
      : `dia ${date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`;

    return `Você vem ${dayLabel} às ${formatTimeBR(appointmentDate)}?`;
  };

  const handleScheduleRequest = async (complaint: string, duration: string) => {
    setIsSubmittingSchedule(true);
    try {
      const res = await fetch('/api/portal/request-appointment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify({
          preferred_date: '',
          preferred_time: '',
          notes: `${complaint} - há ${duration}`
        })
      });
      if (!res.ok) throw new Error('Erro ao solicitar');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingSchedule(false);
    }
  };

  const firstName = patient.name.split(' ')[0];
  const nextAppointment = futureAppointments[0];

  return (
    <>
      <div className="space-y-6">
        {/* ─── ATO 1: Chegada ─── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <p className="text-[#8E8E93] text-[13px] font-medium tracking-wide uppercase">
            {getGreeting()}
          </p>
          <h1 className="text-[#1C1C1E] text-[28px] font-bold tracking-tight mt-1">
            {firstName}
          </h1>
        </motion.div>

        {/* ─── ATO 2: Consulta Próxima ─── */}
        {moment === 'confirming_appointment' && nextAppointment && (() => {
          const nextDate = new Date(nextAppointment.start_time);
          const now = new Date();
          const diffMs = nextDate.getTime() - now.getTime();
          const daysUntil = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

          return (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white to-[#F9FAFB] backdrop-blur-xl border border-white/80 group transition-all duration-300"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#0C9B72]/[0.08] rounded-full blur-3xl group-hover:opacity-100 opacity-60 transition-opacity duration-500" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#0C9B72]/[0.04] rounded-full blur-3xl" />

              <div className="relative z-10 p-8 sm:p-10">
                <div className="flex items-start justify-between gap-4 mb-7">
                  <div className="flex-1 min-w-0">
                    <p className="text-[#0C9B72] text-[12px] font-bold uppercase tracking-wider">
                      Sua Consulta
                    </p>
                    <p className="text-[#1C1C1E] text-[40px] font-bold tracking-tight mt-2 leading-tight">
                      {nextDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '')}
                    </p>
                    <div className="mt-4 space-y-1">
                      <p className="text-[#0C9B72] text-[16px] font-semibold">
                        {formatTimeBR(nextAppointment.start_time)}
                      </p>
                      <p className="text-[#8E8E93] text-[14px] font-medium">
                        Dr(a). {nextAppointment.dentist_name}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2.5 shrink-0">
                    <motion.span
                      whileHover={{ scale: 1.05 }}
                      className={`px-5 py-3 rounded-full text-[13px] font-bold ${getCountdownColor(daysUntil)}`}
                    >
                      {getCountdownLabel(daysUntil)}
                    </motion.span>
                    <span
                      className={`px-5 py-2.5 rounded-full text-[12px] font-semibold ${getStatusConfig(nextAppointment.status).color}`}
                    >
                      {getStatusConfig(nextAppointment.status).label}
                    </span>
                  </div>
                </div>

                {nextAppointment.notes && (
                  <div className="pb-7 border-b border-[#E5E5EA]">
                    <p className="text-[#3A3A3C] text-[15px] leading-relaxed font-medium">
                      {nextAppointment.notes}
                    </p>
                  </div>
                )}

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="mt-7 pt-7 border-t border-[#E5E5EA]"
                >
                  <p className="text-[#1C1C1E] text-[16px] font-semibold mb-4">
                    {getConfirmationQuestion(nextAppointment.start_time)}
                  </p>
                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onConfirmAppointment(nextAppointment.id)}
                      disabled={appointmentSubmittingId === nextAppointment.id}
                      className="flex-1 h-12 px-5 rounded-full bg-gradient-to-r from-[#0C9B72] to-[#0A7D5C] text-white text-[15px] font-semibold tracking-tight active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center"
                    >
                      {appointmentSubmittingId === nextAppointment.id ? (
                        <div className="w-5 h-5 border-2 border-white/25 border-t-white rounded-full animate-spin" />
                      ) : (
                        'Confirmar'
                      )}
                    </motion.button>
                    <motion.button
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onRescheduleAppointment(nextAppointment)}
                      disabled={appointmentSubmittingId === nextAppointment.id}
                      className="flex-1 h-12 px-5 rounded-full border-2 border-[#0C9B72]/30 text-[#1C1C1E] text-[15px] font-semibold tracking-tight active:scale-95 transition-all hover:border-[#0C9B72]/60 hover:bg-[#0C9B72]/5"
                    >
                      Reagendar
                    </motion.button>
                  </div>
                  {confirmedAppointmentId === nextAppointment.id && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-[#34C759] text-[14px] font-semibold mt-4 flex items-center gap-2"
                    >
                      ✓ Horário confirmado
                    </motion.p>
                  )}
                  {rescheduleRequestedAppointmentId === nextAppointment.id && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-[#007AFF] text-[14px] font-semibold mt-4"
                    >
                      Pedido de reagendamento enviado
                    </motion.p>
                  )}
                </motion.div>
              </div>
            </motion.div>
          );
        })()}

        {/* ─── ATO 3: Sem Consulta ─── */}
        {moment === 'no_appointment' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white to-[#F9FAFB] backdrop-blur-xl border border-white/80"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#0C9B72]/[0.08] rounded-full blur-3xl opacity-60" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#0C9B72]/[0.04] rounded-full blur-3xl" />

            <div className="relative z-10 p-8 sm:p-10 text-center">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="w-16 h-16 bg-[#0C9B72]/10 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <Heart size={28} className="text-[#0C9B72]" />
              </motion.div>

              <h2 className="text-[#1C1C1E] text-[28px] font-bold tracking-tight mb-8">
                Tudo certo com seu sorriso?
              </h2>

              <div className="space-y-3">
                <motion.button
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowGuidedConversation(true)}
                  className="w-full h-12 px-5 rounded-full bg-gradient-to-r from-[#FF3B30] to-[#FF1744] text-white text-[15px] font-semibold tracking-tight active:scale-95 transition-all"
                >
                  Preciso de Ajuda
                </motion.button>

                <motion.button
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowGuidedConversation(true)}
                  className="w-full h-12 px-5 rounded-full border-2 border-[#0C9B72]/30 text-[#0C9B72] text-[15px] font-semibold tracking-tight active:scale-95 transition-all hover:border-[#0C9B72]/60 hover:bg-[#0C9B72]/5"
                >
                  Quero Agendar
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ─── ATO 4: Consulta já Confirmada (idle) ─── */}
        {(moment === 'has_appointment_confirmed' || moment === 'idle') && nextAppointment && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="relative overflow-hidden rounded-2xl bg-white/40 backdrop-blur-xl border border-white/50 p-5"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-[#0C9B72]/10 rounded-xl flex items-center justify-center shrink-0">
                <Heart size={20} className="text-[#0C9B72]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[#0C9B72] text-[11px] font-bold uppercase tracking-wide">
                  Próxima Consulta Confirmada
                </p>
                <p className="text-[#1C1C1E] text-[14px] font-semibold mt-1">
                  {formatDateBR(nextAppointment.start_time)} às {formatTimeBR(nextAppointment.start_time)}
                </p>
                <p className="text-[#8E8E93] text-[12px] mt-1">
                  Dr(a). {nextAppointment.dentist_name}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ─── ATO 5: Pós-Operatório ─── */}
        {moment === 'post_operative' && recentProcedures.length > 0 && (() => {
          const proc = recentProcedures[0];
          return (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#FF9500]/10 to-[#FF6347]/5 border border-[#FF9500]/20 p-6"
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="text-[24px] mt-1">🏥</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[#FF9500] text-[11px] font-bold uppercase tracking-wide">
                      Cuidados Importantes
                    </p>
                    <p className="text-[#1C1C1E] text-[14px] font-semibold mt-1">
                      Após {proc.procedure}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    // Swipe para arquivar
                  }}
                  className="text-[#C6C6C8] hover:text-[#1C1C1E] transition-colors p-1"
                >
                  <ChevronUp size={18} />
                </button>
              </div>
              <p className="text-[#FF9500] text-[13px] leading-relaxed">
                Siga as orientações recebidas durante sua consulta para uma melhor recuperação.
              </p>
            </motion.div>
          );
        })()}

        {/* ─── Divider ─── */}
        <div className="h-px bg-gradient-to-r from-transparent via-[#E5E5EA] to-transparent" />

        {/* ─── ATO 6: Ver Mais (Profundidade) ─── */}
        <motion.button
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={onOpenDepth}
          className="w-full flex items-center justify-center gap-2 py-4 text-[#0C9B72] text-[15px] font-semibold hover:opacity-70 transition-opacity"
        >
          Ver seu histórico completo
          <ChevronDown size={16} className="rotate-90" />
        </motion.button>
      </div>

      {/* Guided Conversation Modal */}
      <GuidedConversation
        isOpen={showGuidedConversation}
        onClose={() => setShowGuidedConversation(false)}
        onScheduleRequest={handleScheduleRequest}
        isSubmitting={isSubmittingSchedule}
      />
    </>
  );
}
