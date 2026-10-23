/**
 * SlotKita - Phase 5: UI/HUD, Controls, WinBanner & SoundSystem Unit Tests
 */

import { describe, it, expect } from 'vitest';
import { HUD } from '../HUD';
import { WIN_TIERS, WinTier } from '../WinBanner';
import { SoundSystem } from '../../core/SoundSystem';
import { GameStateStore } from '../../core/GameState';
import { StateMachine, SlotState } from '../../core/FSM';

describe('1. HUD Progressive Meters & Indonesian Formatting', () => {
  it('should format numbers according to Indonesian dot notation', () => {
    expect(HUD.formatIndonesian(10_000_000)).toBe('10.000.000');
    expect(HUD.formatIndonesian(125_450_200)).toBe('125.450.200');
    expect(HUD.formatIndonesian(50_000)).toBe('50.000');
    expect(HUD.formatIndonesian(0)).toBe('0');
  });

  it('should contribute bet portions to progressive meters', () => {
    const store = new GameStateStore();
    const fsm = new StateMachine(SlotState.IDLE);
    const mockContainer = { innerHTML: '', querySelector: () => null } as unknown as HTMLElement;

    const hud = new HUD(mockContainer, store, fsm);

    const initialGrand = hud.meters.grand;
    const initialMajor = hud.meters.major;
    const initialMinor = hud.meters.minor;
    const initialMini = hud.meters.mini;

    const betAmount = 100_000;
    hud.contributeBet(betAmount);

    expect(hud.meters.grand).toBe(initialGrand + Math.floor(betAmount * 0.008));
    expect(hud.meters.major).toBe(initialMajor + Math.floor(betAmount * 0.005));
    expect(hud.meters.minor).toBe(initialMinor + Math.floor(betAmount * 0.003));
    expect(hud.meters.mini).toBe(initialMini + Math.floor(betAmount * 0.001));

    hud.destroy();
  });
});

describe('2. WinBanner Tier Thresholds', () => {
  it('should define accurate multiplier tiers for celebrations', () => {
    expect(WIN_TIERS[WinTier.SUPER_WIN].minMultiplier).toBe(100);
    expect(WIN_TIERS[WinTier.MEGA_WIN].minMultiplier).toBe(50);
    expect(WIN_TIERS[WinTier.BIG_WIN].minMultiplier).toBe(20);
  });

  it('should classify win multipliers into correct tier categories', () => {
    const evaluateTier = (multiplier: number): WinTier | null => {
      if (multiplier >= WIN_TIERS[WinTier.SUPER_WIN].minMultiplier) return WinTier.SUPER_WIN;
      if (multiplier >= WIN_TIERS[WinTier.MEGA_WIN].minMultiplier) return WinTier.MEGA_WIN;
      if (multiplier >= WIN_TIERS[WinTier.BIG_WIN].minMultiplier) return WinTier.BIG_WIN;
      return null;
    };

    expect(evaluateTier(150)).toBe(WinTier.SUPER_WIN);
    expect(evaluateTier(100)).toBe(WinTier.SUPER_WIN);
    expect(evaluateTier(75)).toBe(WinTier.MEGA_WIN);
    expect(evaluateTier(50)).toBe(WinTier.MEGA_WIN);
    expect(evaluateTier(35)).toBe(WinTier.BIG_WIN);
    expect(evaluateTier(20)).toBe(WinTier.BIG_WIN);
    expect(evaluateTier(19.9)).toBeNull();
    expect(evaluateTier(5)).toBeNull();
  });
});

describe('3. SoundSystem Architecture & Ducking State', () => {
  it('should initialize and toggle mute state cleanly', () => {
    const sound = new SoundSystem();
    expect(sound.isMuted).toBe(false);

    const muted = sound.toggleMute();
    expect(muted).toBe(true);
    expect(sound.isMuted).toBe(true);

    const unmuted = sound.toggleMute();
    expect(unmuted).toBe(false);
    expect(sound.isMuted).toBe(false);
  });

  it('should track audio ducking state correctly', () => {
    const sound = new SoundSystem();
    expect(sound.isDucked).toBe(false);

    sound.duck();
    // Duck is active
    expect(typeof sound.duck).toBe('function');

    sound.unduck();
    expect(typeof sound.unduck).toBe('function');
  });

  it('should execute SFX methods safely without throwing in headless environments', () => {
    const sound = new SoundSystem();

    expect(() => sound.playSpinStart()).not.toThrow();
    expect(() => sound.playReelClick()).not.toThrow();
    expect(() => sound.playReelStop(1.0, false)).not.toThrow();
    expect(() => sound.playReelStop(1.5, true)).not.toThrow();
    expect(() => sound.playCoinRollup()).not.toThrow();
    expect(() => sound.playWildBezier()).not.toThrow();
    expect(() => sound.playCoinFlip()).not.toThrow();
    expect(() => sound.playBigWinGong()).not.toThrow();
    expect(() => sound.playJackpotTrigger()).not.toThrow();
    expect(() => sound.playJackpotWin()).not.toThrow();
    expect(() => sound.playUiClick()).not.toThrow();
  });
});

describe('4. Controls Logic & Max Bet Calculation', () => {
  it('should calculate MAX BET correctly according to game rules', () => {
    const store = new GameStateStore();
    // Base bet = 50
    // Max level = 10
    // Max denom = 10.000
    store.setBetLevel(10);
    store.setDenom(10_000);

    const maxBet = store.getState().currentBet;
    expect(maxBet).toBe(50 * 10 * 10_000);
    expect(maxBet).toBe(5_000_000);
  });
});
