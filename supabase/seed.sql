-- =====================================================================
-- Mawjoud - sample data (for development and demos only)
-- Run this AFTER schema.sql.
--
-- WARNING: the first line erases the four tables, so you can re-run this
-- file as many times as you like. Never run it on real data.
--
-- The medicines, pharmacies and barcodes below are ILLUSTRATIVE. The
-- barcodes are fake numbers (they start with 6191234). To test the
-- scanner with a real box, scan it once, then add its number with:
--   insert into barcodes (barcode, medication_id) values ('YOUR_NUMBER', 1);
-- =====================================================================

truncate stock, barcodes, pharmacies, medications restart identity cascade;

-- ---------------------------------------------------------------------
-- Medicines
-- ---------------------------------------------------------------------
insert into medications (name, dosage, form) values
  ('Doliprane',  '1000 mg', 'comprimé'),
  ('Efferalgan', '500 mg',  'comprimé effervescent'),
  ('Panadol',    '500 mg',  'comprimé'),
  ('Augmentin',  '1 g',     'comprimé'),
  ('Clamoxyl',   '1 g',     'comprimé dispersible'),
  ('Voltarène',  '50 mg',   'comprimé gastro-résistant'),
  ('Spasfon',    '80 mg',   'comprimé'),
  ('Ventoline',  '100 µg',  'suspension pour inhalation'),
  ('Smecta',     '3 g',     'sachet'),
  ('Aspégic',    '1000 mg', 'sachet'),
  ('Brufen',     '400 mg',  'comprimé'),
  ('Nurofen',    '200 mg',  'comprimé');

-- ---------------------------------------------------------------------
-- Barcodes (fake EAN-13 numbers with a valid check digit)
-- Doliprane has two barcodes to show that one medicine can have several.
-- ---------------------------------------------------------------------
insert into barcodes (barcode, medication_id) values
  ('6191234000011', 1),
  ('6191234000134', 1),
  ('6191234000028', 2),
  ('6191234000035', 3),
  ('6191234000042', 4),
  ('6191234000059', 5),
  ('6191234000066', 6),
  ('6191234000073', 7),
  ('6191234000080', 8),
  ('6191234000097', 9),
  ('6191234000103', 10),
  ('6191234000110', 11),
  ('6191234000127', 12);

-- ---------------------------------------------------------------------
-- Pharmacies (fictional names, approximate GPS positions in Tunis and Sousse)
-- ---------------------------------------------------------------------
insert into pharmacies (name, address, phone, latitude, longitude) values
  ('Pharmacie Centrale (exemple)',  'Avenue Habib Bourguiba, Tunis',    '71 000 001', 36.7992, 10.1800),
  ('Pharmacie du Lac (exemple)',    'Les Berges du Lac 1, Tunis',       '71 000 002', 36.8330, 10.2330),
  ('Pharmacie El Menzah (exemple)', 'El Menzah 6, Tunis',               '71 000 003', 36.8420, 10.1650),
  ('Pharmacie Ariana (exemple)',    'Centre ville, Ariana',             '71 000 004', 36.8625, 10.1956),
  ('Pharmacie La Marsa (exemple)',  'Avenue Habib Bourguiba, La Marsa', '71 000 005', 36.8780, 10.3250),
  ('Pharmacie Sousse Centre (exemple)', 'Avenue Habib Bourguiba, Sousse', '73 000 001', 35.8256, 10.6411),
  ('Pharmacie Khezama (exemple)',   'Khezama Est, Sousse',              '73 000 002', 35.8410, 10.6000),
  ('Pharmacie Sahloul (exemple)',   'Cité Sahloul, Sousse',             '73 000 003', 35.8350, 10.5950);

-- ---------------------------------------------------------------------
-- Stock
-- Each line: pharmacy name, medicine name, status, and how long ago it
-- was last updated (so you can see the "il y a ..." label in the app).
-- ---------------------------------------------------------------------
insert into stock (pharmacy_id, medication_id, status, updated_at)
select p.id, m.id, v.status, now() - v.age
from (values
  -- Doliprane: available almost everywhere
  ('Pharmacie Centrale (exemple)',      'Doliprane',  'in_stock', interval '12 minutes'),
  ('Pharmacie du Lac (exemple)',        'Doliprane',  'low',      interval '2 hours'),
  ('Pharmacie El Menzah (exemple)',     'Doliprane',  'in_stock', interval '45 minutes'),
  ('Pharmacie Ariana (exemple)',        'Doliprane',  'out',      interval '1 day'),
  ('Pharmacie La Marsa (exemple)',      'Doliprane',  'in_stock', interval '3 hours'),
  ('Pharmacie Sousse Centre (exemple)', 'Doliprane',  'in_stock', interval '20 minutes'),
  ('Pharmacie Khezama (exemple)',       'Doliprane',  'low',      interval '5 hours'),
  ('Pharmacie Sahloul (exemple)',       'Doliprane',  'in_stock', interval '2 days'),

  -- Efferalgan
  ('Pharmacie Centrale (exemple)',      'Efferalgan', 'low',      interval '30 minutes'),
  ('Pharmacie Ariana (exemple)',        'Efferalgan', 'in_stock', interval '4 hours'),
  ('Pharmacie Sousse Centre (exemple)', 'Efferalgan', 'in_stock', interval '1 hour'),
  ('Pharmacie Sahloul (exemple)',       'Efferalgan', 'out',      interval '6 hours'),

  -- Panadol
  ('Pharmacie du Lac (exemple)',        'Panadol',    'in_stock', interval '8 minutes'),
  ('Pharmacie La Marsa (exemple)',      'Panadol',    'in_stock', interval '2 hours'),
  ('Pharmacie Khezama (exemple)',       'Panadol',    'in_stock', interval '3 hours'),

  -- Augmentin
  ('Pharmacie Centrale (exemple)',      'Augmentin',  'in_stock', interval '1 hour'),
  ('Pharmacie El Menzah (exemple)',     'Augmentin',  'low',      interval '7 hours'),
  ('Pharmacie Sousse Centre (exemple)', 'Augmentin',  'low',      interval '90 minutes'),

  -- Clamoxyl
  ('Pharmacie Ariana (exemple)',        'Clamoxyl',   'in_stock', interval '2 hours'),
  ('Pharmacie Sahloul (exemple)',       'Clamoxyl',   'in_stock', interval '25 minutes'),

  -- Voltarène
  ('Pharmacie du Lac (exemple)',        'Voltarène',  'in_stock', interval '15 minutes'),
  ('Pharmacie La Marsa (exemple)',      'Voltarène',  'out',      interval '3 days'),
  ('Pharmacie Khezama (exemple)',       'Voltarène',  'low',      interval '4 hours'),

  -- Spasfon
  ('Pharmacie Centrale (exemple)',      'Spasfon',    'in_stock', interval '50 minutes'),
  ('Pharmacie El Menzah (exemple)',     'Spasfon',    'in_stock', interval '2 hours'),
  ('Pharmacie Sousse Centre (exemple)', 'Spasfon',    'in_stock', interval '35 minutes'),

  -- Ventoline
  ('Pharmacie Ariana (exemple)',        'Ventoline',  'low',      interval '1 hour'),
  ('Pharmacie Sahloul (exemple)',       'Ventoline',  'in_stock', interval '3 hours'),

  -- Smecta
  ('Pharmacie Centrale (exemple)',      'Smecta',     'in_stock', interval '20 minutes'),
  ('Pharmacie du Lac (exemple)',        'Smecta',     'in_stock', interval '5 hours'),
  ('Pharmacie Khezama (exemple)',       'Smecta',     'in_stock', interval '1 hour'),

  -- Aspégic
  ('Pharmacie El Menzah (exemple)',     'Aspégic',    'in_stock', interval '40 minutes'),
  ('Pharmacie Sousse Centre (exemple)', 'Aspégic',    'out',      interval '2 hours'),

  -- Brufen
  ('Pharmacie La Marsa (exemple)',      'Brufen',     'in_stock', interval '6 hours'),
  ('Pharmacie Sahloul (exemple)',       'Brufen',     'low',      interval '2 days'),

  -- Nurofen
  ('Pharmacie Centrale (exemple)',      'Nurofen',    'in_stock', interval '10 minutes'),
  ('Pharmacie Ariana (exemple)',        'Nurofen',    'in_stock', interval '3 hours'),
  ('Pharmacie Khezama (exemple)',       'Nurofen',    'low',      interval '1 day')
) as v(pharmacy_name, medication_name, status, age)
join pharmacies p on p.name = v.pharmacy_name
join medications m on m.name = v.medication_name;
