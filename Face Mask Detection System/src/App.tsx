import React, { useState, useRef, useEffect } from 'react';
import { Camera, Shield, AlertTriangle, Settings, Play, Pause, BarChart3 } from 'lucide-react';

interface Detection {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  hasMask: boolean;
  confidence: number;
  timestamp: number;
}

interface Stats {
  totalDetections: number;
  maskedCount: number;
  unmaskedCount: number;
  complianceRate: number;
}

function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalDetections: 0,
    maskedCount: 0,
    unmaskedCount: 0,
    complianceRate: 0
  });
  const [alerts, setAlerts] = useState<string[]>([]);
  const [sensitivity, setSensitivity] = useState(0.7);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  useEffect(() => {
    if (isDetecting) {
      const interval = setInterval(() => {
        simulateDetection();
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isDetecting, sensitivity]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      // Fallback to demo mode
      simulateCameraFeed();
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
  };

  const simulateCameraFeed = () => {
    // Create a placeholder video feed for demo
    if (videoRef.current) {
      videoRef.current.style.background = 'linear-gradient(45deg, #1a1a2e, #16213e)';
    }
  };

  const simulateDetection = () => {
    const newDetections: Detection[] = [];
    const hasPersonPresent = Math.random() > 0.6; // 40% chance someone is present
    
    if (!hasPersonPresent) {
      setDetections([]);
      return;
    }

    // Detect only one person when present
    const detection: Detection = {
      id: `face-${Date.now()}`,
      x: Math.random() * 500 + 50,
      y: Math.random() * 300 + 50,
      width: 80 + Math.random() * 40,
      height: 100 + Math.random() * 40,
      hasMask: Math.random() > 0.3, // 70% chance of wearing mask
      confidence: Math.random() * 0.3 + 0.7, // 70-100% confidence
      timestamp: Date.now()
    };
    newDetections.push(detection);

    // Add alert for unmasked faces
    if (!detection.hasMask) {
      const alertMessage = `Alert: No mask detected at ${new Date().toLocaleTimeString()}`;
      setAlerts(prev => [alertMessage, ...prev.slice(0, 4)]);
    }

    setDetections(newDetections);
    updateStats(newDetections);
  };

  const updateStats = (currentDetections: Detection[]) => {
    setStats(prev => {
      const newTotal = prev.totalDetections + currentDetections.length;
      const newMasked = prev.maskedCount + currentDetections.filter(d => d.hasMask).length;
      const newUnmasked = prev.unmaskedCount + currentDetections.filter(d => !d.hasMask).length;
      
      return {
        totalDetections: newTotal,
        maskedCount: newMasked,
        unmaskedCount: newUnmasked,
        complianceRate: newTotal > 0 ? (newMasked / newTotal) * 100 : 0
      };
    });
  };

  const toggleDetection = () => {
    setIsDetecting(!isDetecting);
  };

  const resetStats = () => {
    setStats({
      totalDetections: 0,
      maskedCount: 0,
      unmaskedCount: 0,
      complianceRate: 0
    });
    setAlerts([]);
  };

  const drawDetections = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    detections.forEach(detection => {
      const color = detection.hasMask ? '#10b981' : '#ef4444';
      const label = detection.hasMask ? 'MASK' : 'NO MASK';
      
      // Draw bounding box
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.strokeRect(detection.x, detection.y, detection.width, detection.height);
      
      // Draw label background
      ctx.fillStyle = color;
      ctx.fillRect(detection.x, detection.y - 30, detection.width, 30);
      
      // Draw label text
      ctx.fillStyle = 'white';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(
        `${label} (${(detection.confidence * 100).toFixed(0)}%)`,
        detection.x + detection.width / 2,
        detection.y - 8
      );
    });
  };

  useEffect(() => {
    drawDetections();
  }, [detections]);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-400" />
            <h1 className="text-2xl font-bold">Face Mask Detection System</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isDetecting ? 'bg-green-400' : 'bg-red-400'}`} />
              <span className="text-sm">
                {isDetecting ? 'Detecting' : 'Stopped'}
              </span>
            </div>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 p-6">
        {/* Main Video Feed */}
        <div className="flex-1">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Camera className="w-5 h-5" />
                Live Feed
              </h2>
              <button
                onClick={toggleDetection}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isDetecting 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {isDetecting ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {isDetecting ? 'Stop' : 'Start'} Detection
              </button>
            </div>
            
            <div className="relative bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                muted
                className="w-full h-80 object-cover"
                width="640"
                height="480"
              />
              <canvas
                ref={canvasRef}
                width="640"
                height="480"
                className="absolute top-0 left-0 w-full h-full pointer-events-none"
              />
              {!isDetecting && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                  <div className="text-center">
                    <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400">Click "Start Detection" to begin</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-full lg:w-80 space-y-6">
          {/* Statistics */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Statistics
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-400">Total Detections:</span>
                <span className="font-semibold">{stats.totalDetections}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">With Mask:</span>
                <span className="font-semibold text-green-400">{stats.maskedCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Without Mask:</span>
                <span className="font-semibold text-red-400">{stats.unmaskedCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Compliance Rate:</span>
                <span className={`font-semibold ${stats.complianceRate >= 90 ? 'text-green-400' : stats.complianceRate >= 70 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {stats.complianceRate.toFixed(1)}%
                </span>
              </div>
            </div>
            <button
              onClick={resetStats}
              className="w-full mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Reset Statistics
            </button>
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">Detection Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Sensitivity: {(sensitivity * 100).toFixed(0)}%
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="1"
                    step="0.1"
                    value={sensitivity}
                    onChange={(e) => setSensitivity(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Alerts */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              Recent Alerts
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {alerts.length === 0 ? (
                <p className="text-gray-400 text-sm">No alerts</p>
              ) : (
                alerts.map((alert, index) => (
                  <div
                    key={index}
                    className="bg-red-900 bg-opacity-50 border border-red-500 rounded-lg p-3 text-sm"
                  >
                    {alert}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Current Detections */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Current Detections</h3>
            <div className="space-y-2">
              {detections.length === 0 ? (
                <p className="text-gray-400 text-sm">No faces detected</p>
              ) : (
                detections.map((detection) => (
                  <div
                    key={detection.id}
                    className={`flex items-center justify-between p-2 rounded-lg ${
                      detection.hasMask ? 'bg-green-900 bg-opacity-50' : 'bg-red-900 bg-opacity-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${
                        detection.hasMask ? 'bg-green-400' : 'bg-red-400'
                      }`} />
                      <span className="text-sm">
                        {detection.hasMask ? 'Mask' : 'No Mask'}
                      </span>
                    </div>
                    <span className="text-sm text-gray-400">
                      {(detection.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;