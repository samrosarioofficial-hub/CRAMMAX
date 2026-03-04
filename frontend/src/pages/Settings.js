import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import apiClient from '@/utils/api';
import Navigation from '@/components/Navigation';
import { toast } from 'sonner';
import { Settings as SettingsIcon, Save } from 'lucide-react';

const Settings = () => {
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const response = await apiClient.get('/preferences');
      setPreferences(response.data);
    } catch (error) {
      console.error('Error fetching preferences:', error);
      // Set defaults
      setPreferences({
        phase_durations: { preview: 5, learn: 35, recall: 10, test: 10 },
        timer_brightness: 100,
        enable_sounds: true,
        show_on_leaderboard: false
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiClient.post('/preferences', preferences);
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const updatePhaseDuration = (phase, value) => {
    setPreferences({
      ...preferences,
      phase_durations: {
        ...preferences.phase_durations,
        [phase]: parseInt(value) || 0
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-400 font-mono-display">LOADING...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-8 py-12">
        <div className="flex items-center gap-4 mb-12">
          <SettingsIcon className="h-10 w-10 text-primary" strokeWidth={1.5} />
          <h1 className="font-heading font-black text-5xl uppercase tracking-tighter" data-testid="settings-title">
            SETTINGS
          </h1>
        </div>

        {/* Phase Durations */}
        <div className="stat-card p-8 rounded-sm mb-8">
          <h2 className="font-heading text-2xl uppercase tracking-wider font-semibold mb-6">PHASE DURATIONS</h2>
          <p className="text-zinc-400 text-sm mb-6">Customize the duration of each MAX MODE phase (in minutes)</p>
          
          <div className="space-y-6">
            <div>
              <Label className="text-zinc-300 text-xs uppercase tracking-wider mb-2 block">Preview Phase</Label>
              <Input
                type="number"
                min="1"
                max="60"
                value={preferences.phase_durations.preview}
                onChange={(e) => updatePhaseDuration('preview', e.target.value)}
                className="bg-zinc-950 border-zinc-800 focus:ring-1 focus:ring-primary rounded-none w-32"
                data-testid="preview-duration-input"
              />
              <span className="text-zinc-500 text-xs ml-2">minutes</span>
            </div>
            
            <div>
              <Label className="text-zinc-300 text-xs uppercase tracking-wider mb-2 block">Learn Phase</Label>
              <Input
                type="number"
                min="1"
                max="120"
                value={preferences.phase_durations.learn}
                onChange={(e) => updatePhaseDuration('learn', e.target.value)}
                className="bg-zinc-950 border-zinc-800 focus:ring-1 focus:ring-primary rounded-none w-32"
                data-testid="learn-duration-input"
              />
              <span className="text-zinc-500 text-xs ml-2">minutes</span>
            </div>
            
            <div>
              <Label className="text-zinc-300 text-xs uppercase tracking-wider mb-2 block">Recall Phase</Label>
              <Input
                type="number"
                min="1"
                max="60"
                value={preferences.phase_durations.recall}
                onChange={(e) => updatePhaseDuration('recall', e.target.value)}
                className="bg-zinc-950 border-zinc-800 focus:ring-1 focus:ring-primary rounded-none w-32"
                data-testid="recall-duration-input"
              />
              <span className="text-zinc-500 text-xs ml-2">minutes</span>
            </div>
            
            <div>
              <Label className="text-zinc-300 text-xs uppercase tracking-wider mb-2 block">Test Phase</Label>
              <Input
                type="number"
                min="1"
                max="60"
                value={preferences.phase_durations.test}
                onChange={(e) => updatePhaseDuration('test', e.target.value)}
                className="bg-zinc-950 border-zinc-800 focus:ring-1 focus:ring-primary rounded-none w-32"
                data-testid="test-duration-input"
              />
              <span className="text-zinc-500 text-xs ml-2">minutes</span>
            </div>
          </div>
        </div>

        {/* Timer Settings */}
        <div className="stat-card p-8 rounded-sm mb-8">
          <h2 className="font-heading text-2xl uppercase tracking-wider font-semibold mb-6">TIMER DISPLAY</h2>
          
          <div className="mb-6">
            <Label className="text-zinc-300 text-xs uppercase tracking-wider mb-4 block">
              Brightness: {preferences.timer_brightness}%
            </Label>
            <Slider
              value={[preferences.timer_brightness]}
              onValueChange={(value) => setPreferences({ ...preferences, timer_brightness: value[0] })}
              min={30}
              max={100}
              step={10}
              className="w-full max-w-md"
              data-testid="brightness-slider"
            />
            <p className="text-zinc-500 text-xs mt-2">Adjust timer brightness for comfortable viewing</p>
          </div>

          <div className="flex items-center justify-between py-4 border-t border-zinc-800">
            <div>
              <Label className="text-zinc-300 text-sm">Enable Sound Notifications</Label>
              <p className="text-zinc-500 text-xs mt-1">Play sound when phase timer ends</p>
            </div>
            <Switch
              checked={preferences.enable_sounds}
              onCheckedChange={(checked) => setPreferences({ ...preferences, enable_sounds: checked })}
              data-testid="sounds-toggle"
            />
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="stat-card p-8 rounded-sm mb-8">
          <h2 className="font-heading text-2xl uppercase tracking-wider font-semibold mb-6">PRIVACY & LEADERBOARD</h2>
          
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-zinc-300 text-sm">Show on Leaderboard</Label>
              <p className="text-zinc-500 text-xs mt-1 max-w-md">Display your name and stats on the global leaderboard for accountability</p>
            </div>
            <Switch
              checked={preferences.show_on_leaderboard}
              onCheckedChange={(checked) => setPreferences({ ...preferences, show_on_leaderboard: checked })}
              data-testid="leaderboard-toggle"
            />
          </div>
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full md:w-auto bg-primary hover:bg-primary/90 text-white rounded-none uppercase tracking-widest font-semibold px-12 py-5 shadow-[0_0_15px_-3px_rgba(37,99,235,0.3)] border-0 transition-colors duration-100"
          data-testid="save-settings-btn"
        >
          <Save className="mr-2 h-5 w-5" />
          {saving ? 'SAVING...' : 'SAVE SETTINGS'}
        </Button>
      </div>
    </div>
  );
};

export default Settings;
