-- Add round_data to game_states for tracking tie state and last round result
ALTER TABLE game_states ADD COLUMN IF NOT EXISTS round_data JSONB NOT NULL DEFAULT '{}';

-- Allow "pot" as a valid stack_type in player_hands for tie accumulation
ALTER TABLE player_hands DROP CONSTRAINT IF EXISTS player_hands_stack_type_check;
ALTER TABLE player_hands ADD CONSTRAINT player_hands_stack_type_check
  CHECK (stack_type IN ('main', 'side', 'pot'));

-- Index to speed up top-card fetches
CREATE INDEX IF NOT EXISTS idx_player_hands_top
  ON player_hands (game_state_id, player_id, stack_type, position);
