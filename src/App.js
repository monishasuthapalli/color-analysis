import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { ImageColorPicker } from 'react-image-color-picker';
import axios from 'axios';

const ColorAnalysisApp = () => {
  const [photo, setPhoto] = useState(null);
  const [eyeColor, setEyeColor] = useState('#000000');
  const [skinColor, setSkinColor] = useState('#FFFFFF');
  const [hairColor, setHairColor] = useState('#000000');
  const [seasonAnalysis, setSeasonAnalysis] = useState('');
  const [palette, setColorPalette] = useState([]);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [selectedAttribute, setSelectedAttribute] = useState(null);

  const handlePhotoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setPhoto(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    // You can handle the cropped area if needed
  }, []);

  const handleColorPick = (color) => {
    switch (selectedAttribute) {
      case 'eye':
        setEyeColor(color);
        console.log(`Eye Color Selected: ${color}`);
        break;
      case 'skin':
        setSkinColor(color);
        console.log(`Skin Color Selected: ${color}`);
        break;
      case 'hair':
        setHairColor(color);
        console.log(`Hair Color Selected: ${color}`);
        break;
      default:
        break;
    }
    setSelectedAttribute(null);
  };

  const callLlmForSeasonAnalysis = async () => {
    try {
      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: `Based on my face colors - Eye: ${eyeColor}, Skin: ${skinColor}, Hair: ${hairColor} which are in rgb, convert these into hsv and determine korean color analysis, Response should contain first line for "which Korean color season do I belong to and the season value"? And the next line of response Please give my color analysis for all the twelve seasons : colors that suit me in all season.`
          }
        ],
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      setSeasonAnalysis(response.data.choices[0].message.content);
    } catch (error) {
      console.error('Error calling LLM for season analysis:', error);
    }
  };

  const callLlmForTopColors = async () => {
    try {
      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: `Based on the RGB colors - Eye: ${eyeColor}, Skin: ${skinColor}, Hair: ${hairColor}, Based on the top 10 colors that suit me from different seasons , generate a five colors, see to it no color repeats from the same season of these 5 : mix of light and dark colors, avoid black and related hex codes, try to include pastel as well. Provide the colors in hex format, separated by commas.`
          }
        ],
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      const palette = response.data.choices[0].message.content.split(',').map(color => color.trim());
      setColorPalette(palette);
        } catch (error) {
      console.error('Error calling LLM for top colors:', error);
    }
  };

  const handleAnalysis = async () => {
    await callLlmForSeasonAnalysis();
    await callLlmForTopColors();
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', backgroundColor: '#f4f4f4', minHeight: '100vh' }}>
      <h1 style={{ textAlign: 'center', fontSize: '2rem', marginBottom: '20px' }}>Color Analysis App</h1>

      <div style={{ marginBottom: '20px' }}>
        <input
          type="file"
          accept="image/*"
          onChange={handlePhotoUpload}
          id="photo-upload"
          style={{ display: 'none' }}
        />
        <label htmlFor="photo-upload" style={{ display: 'block', width: '100%', height: '200px', border: '2px dashed #ccc', cursor: 'pointer', textAlign: 'center', lineHeight: '200px' }}>
          {photo ? (
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
              <Cropper
                image={photo}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>
          ) : (
            <span>Upload a photo</span>
          )}
        </label>
      </div>

      {photo && (
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>Pick Colors</h2>
          <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
            <button onClick={() => setSelectedAttribute('eye')} style={buttonStyle}>Select Eye Color</button>
            <button onClick={() => setSelectedAttribute('skin')} style={buttonStyle}>Select Skin Color</button>
            <button onClick={() => setSelectedAttribute('hair')} style={buttonStyle}>Select Hair Color</button>
          </div>

          {selectedAttribute && (
            <ImageColorPicker
              onColorPick={handleColorPick}
              imgSrc={photo}
            >
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid white', backgroundColor: eyeColor }} />
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid white', backgroundColor: skinColor }} />
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid white', backgroundColor: hairColor }} />
              </div>
            </ImageColorPicker>
          )}
        </div>
      )}

      <button onClick={handleAnalysis} style={{ width: '100%', padding: '10px', backgroundColor: '#007BFF', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginBottom: '20px' }}>
        Analyze Colors
      </button>

      {seasonAnalysis && (
        <div style={{ 
          backgroundColor: '#FFE5E5', 
          borderRadius: '10px', 
          padding: '20px', 
          marginBottom: '20px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '10px', color: '#FF69B4' }}>Your Color Season Analysis</h2>
          <p style={{ whiteSpace: 'pre-wrap', color: '#4A4A4A' }}>{seasonAnalysis}</p>
        </div>
      )}

{palette.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>Your Cohesive Color Palette</h2>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            {palette.map((color, index) => (
              <div
                key={index}
                style={{
                  backgroundColor: color,
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  color: getLuminance(color) > 0.5 ? '#000' : '#fff',
                }}
              >
                <p style={{ fontSize: '0.8rem', margin: '0' }}>{color}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to calculate luminance for text color contrast
const getLuminance = (hex) => {
  const rgb = parseInt(hex.slice(1), 16);
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = (rgb >> 0) & 0xff;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
};

const buttonStyle = {
  padding: '10px',
  backgroundColor: '#007BFF',
  color: 'white',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
  width: '100%',
  marginBottom: '10px'
};

export default ColorAnalysisApp;