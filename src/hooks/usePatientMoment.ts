import { useMemo } from 'react';

export type PatientMoment = 
  | 'arrival'
  | 'confirming_appointment'
  | 'no_appointment'
  | 'has_appointment_confirmed'
  | 'post_operative'
  | 'idle';

interface UsePatientMomentProps {
  futureAppointments: Array<{ id: number; start_time: string; status: string }>;
  recentProcedures: Array<{ date: string; procedure: string }>;
}

export function usePatientMoment({ futureAppointments, recentProcedures }: UsePatientMomentProps): PatientMoment {
  return useMemo(() => {
    const hasNextAppointment = futureAppointments.length > 0;
    const nextApp = futureAppointments[0];
    
    // Prioridade 1: Se tem procedimento recente (< 7 dias), mostra pós-operatório
    if (recentProcedures.length > 0) {
      return 'post_operative';
    }
    
    // Prioridade 2: Se tem consulta não confirmada, mostra confirmação
    if (hasNextAppointment && nextApp.status === 'SCHEDULED') {
      return 'confirming_appointment';
    }
    
    // Prioridade 3: Se tem consulta confirmada, idle
    if (hasNextAppointment && nextApp.status === 'CONFIRMED') {
      return 'has_appointment_confirmed';
    }
    
    // Prioridade 4: Se não tem consulta, convida ação
    if (!hasNextAppointment) {
      return 'no_appointment';
    }
    
    // Default
    return 'idle';
  }, [futureAppointments, recentProcedures]);
}
