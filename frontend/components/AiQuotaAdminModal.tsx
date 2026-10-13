// ============================================================================
// LISTADO RÁPIDO DE USUARIOS MÉDICOS PARA EL MODAL ADMINISTRATIVO
// ============================================================================
app.get('/api/admin/users', optionalAuth, async (_req: Request, res: Response) => {
  try {
    // Busca en DoctorUserModel y en User como respaldo polimórfico
    const doctors = await DoctorUserModel.find({}, 'username doctorName fullName colegiadoNumber personalAiQuotaPool personalLicense').lean();
    
    if (doctors && doctors.length > 0) {
      const formatted = doctors.map((doc: any) => ({
        id: doc._id.toString(),
        username: doc.username,
        doctorName: doc.fullName || doc.doctorName || doc.username,
        colegiadoNumber: doc.colegiadoNumber,
        aiTokensTotal: doc.personalAiQuotaPool?.totalTokensPurchased ?? 100,
        aiTokensUsed: doc.personalAiQuotaPool?.tokensUsed ?? 0
      }));
      return res.status(200).json({ success: true, users: formatted });
    }

    // Si aún no hay doctores creados, devolvemos el perfil principal
    return res.status(200).json({
      success: true,
      users: [
        {
          id: 'PAC-8104',
          username: 'harold01',
          doctorName: 'Dr. Alejandro Morales Rivera',
          colegiadoNumber: 749210,
          aiTokensTotal: 100,
          aiTokensUsed: 0
        }
      ]
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});
