# Light Matrix Display - An interactive web application that simulates a matrix of light needles

# AIclock - Light Matrix Display / 光线矩阵显示器 / ライトマトリックスディスプレイ

[English](#english) | [中文](#中文) | [日本語](#日本語)

![Demo](example/demo.gif)

## English

### Introduction
AIclock is an interactive web application that simulates a matrix of light needles, capable of displaying time, text, and animations. Each light point consists of two needles that can rotate independently to create various visual effects.

### Demo Video
<div align="center">
  <a href="example/shuai.mp4" target="_blank">
    <img src="example/demo.gif" width="600" alt="Demo Video"/>
  </a>
  <p>👆 Click to watch demo video</p>
</div>

### Features
- Real-time clock display
- Text display support
- Custom animations
- Interactive editing mode
- Auto-play functionality
- Configurable display parameters
- Debug information panel

### Screenshots
<div align="center">
<img src="example/ky2.png" width="300" alt="Clock Mode"/>
<img src="example/ky3.png" width="300" alt="Text Mode"/>
<img src="example/ky4.png" width="300" alt="Animation Mode"/>
</div>

### Project Structure
```
aiclock/
├── index.html              # Main HTML file
├── styles.css             # Styles
├── js/
│   ├── main.js           # Main Vue application
│   ├── LightMatrix.js    # Light matrix rendering
│   └── animations.js     # Animation definitions
├── font_configs/         # Font configuration files
│   ├── number_config.json
│   └── style_config.json
└── python/              # Font processing tools
    ├── font_code.py
    └── matrix_control.py
```

### Technical Details
- Frontend: Vue.js 3
- Canvas-based rendering
- JSON-based font configuration
- Python tools for font processing

### Quick Start
1. Clone the repository
```bash
git clone https://github.com/yourusername/aiclock.git
```

2. Set up the development environment
```bash
# For font processing tools (optional)
pip install freetype-py numpy
```

3. Deploy the static files to your web server or run locally

### Usage
- The display automatically shows current time
- Click on any light point in edit mode to adjust needle positions
- Configure display parameters through the settings panel
- Create custom animations using the animation API

### License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
Commercial use is permitted.

### Author
- Guang Li (guangli@xrunda.com)

---

## 中文

[... 中文内容与英文对应 ...]

---

## 日本語

[... 日本語内容与英文对应 ...]

---

## Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## Project Status
Active development - This project is being actively developed and maintained.
