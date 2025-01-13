from flask import Flask, jsonify, request
from flask_cors import CORS
from matrix_control import MatrixDisplay

app = Flask(__name__)
CORS(app)  # 启用跨域支持

# 初始化显示控制器
display = MatrixDisplay('font_configs/Phosphate_12.json')

@app.route('/get_char_matrix', methods=['GET'])
def get_char_matrix():
    char = request.args.get('char', '0')  # 默认显示 '0'
    needles = display.get_char_needles(char)
    if needles is None:
        return jsonify({'error': f"Character '{char}' not found"}), 404
    
    return jsonify({
        'matrix': needles['matrix'].tolist(),
        'shape': needles['shape'],
        'gray_matrix': needles['gray_matrix']
    })

if __name__ == '__main__':
    app.run(port=8081, debug=True) 