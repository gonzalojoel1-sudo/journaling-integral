import { Hono } from 'hono';
import { db } from '../db';
import { weeklyPlans, quarterlyPlans } from '@journaling/shared/db/schema';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { getISOWeekLabel } from '@journaling/shared';

export const planningRoutes = new Hono();

planningRoutes.get('/weekly', async (c) => {
  try {
    const userId = c.get('userId');
    const currentWeekLabel = getISOWeekLabel();
    const plan = await db.query.weeklyPlans.findFirst({
      where: and(eq(weeklyPlans.userId, userId), eq(weeklyPlans.weekLabel, currentWeekLabel)),
    });
    return c.json({ success: true, data: plan || null });
  } catch (error) {
    console.error('Error al obtener plan semanal:', error);
    return c.json({ success: false, error: 'No se pudo cargar la planificacion semanal' }, 500);
  }
});

planningRoutes.post('/weekly', async (c) => {
  try {
    const formData = await c.req.json();
    const userId = c.get('userId');
    const currentWeekLabel = getISOWeekLabel();

    const activePlan = await db.query.weeklyPlans.findFirst({
      where: and(eq(weeklyPlans.userId, userId), eq(weeklyPlans.weekLabel, currentWeekLabel)),
    });

    const planId = activePlan?.id || randomUUID();

    const planData = {
      id: planId,
      userId,
      weekLabel: currentWeekLabel,
      focus: formData.focus || '',
      tasksJson: formData.tasks ? JSON.stringify(formData.tasks) : '[]',
      relationToNutre: formData.relationToNutre || null,
      createdAt: activePlan?.createdAt || new Date().toISOString(),
    };

    if (activePlan) {
      await db.update(weeklyPlans).set(planData).where(eq(weeklyPlans.id, activePlan.id));
    } else {
      await db.insert(weeklyPlans).values(planData);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('Error al guardar plan semanal:', error);
    return c.json({ success: false, error: 'No se pudo guardar la planeacion dominical' }, 500);
  }
});

planningRoutes.get('/quarterly', async (c) => {
  try {
    const userId = c.get('userId');
    const plan = await db.query.quarterlyPlans.findFirst({
      where: and(eq(quarterlyPlans.userId, userId), eq(quarterlyPlans.isActive, 1)),
    });
    return c.json({ success: true, data: plan || null });
  } catch (error) {
    console.error('Error al obtener plan trimestral:', error);
    return c.json({ success: false, error: 'No se pudo cargar el plan trimestral' }, 500);
  }
});

planningRoutes.post('/quarterly', async (c) => {
  try {
    const formData = await c.req.json();
    const userId = c.get('userId');

    const activePlan = await db.query.quarterlyPlans.findFirst({
      where: and(eq(quarterlyPlans.userId, userId), eq(quarterlyPlans.isActive, 1)),
    });

    const planId = activePlan?.id || randomUUID();

    const planData = {
      id: planId,
      userId,
      quarterLabel: formData.quarterLabel || 'Q1/2026',
      year: formData.year ? Number(formData.year) : new Date().getFullYear(),
      isActive: 1,
      fiveYearSpiritual: formData.fiveYearSpiritual || null,
      fiveYearBeing: formData.fiveYearBeing || null,
      fiveYearBusiness: formData.fiveYearBusiness || null,
      fiveYearRelations: formData.fiveYearRelations || null,
      quarterlySpiritual: formData.quarterlySpiritual || null,
      quarterlyBeing: formData.quarterlyBeing || null,
      quarterlyBusiness: formData.quarterlyBusiness || null,
      quarterlyRelations: formData.quarterlyRelations || null,
      smartObjectivesJson: formData.smartObjectives ? JSON.stringify(formData.smartObjectives) : '[]',
      actionsPlanJson: formData.actionsPlan ? JSON.stringify(formData.actionsPlan) : '[]',
      legacyAuditNotes: formData.legacyAuditNotes || null,
      createdAt: activePlan?.createdAt || new Date().toISOString(),
    };

    if (activePlan) {
      await db.update(quarterlyPlans).set(planData).where(eq(quarterlyPlans.id, activePlan.id));
    } else {
      await db.insert(quarterlyPlans).values(planData);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('Error al guardar planeamiento trimestral:', error);
    return c.json({ success: false, error: 'No se pudo guardar la planeacion' }, 500);
  }
});
