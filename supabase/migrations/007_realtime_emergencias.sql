-- Habilita Realtime en emergencias para que la garita reciba alertas sin recargar
ALTER PUBLICATION supabase_realtime ADD TABLE emergencias;
