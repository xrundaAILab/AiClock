import freetype
import numpy as np
import json
import os

def get_char_matrix(font_path, char, size):
    face = freetype.Face(font_path)
    face.set_pixel_sizes(0, size)
    face.load_char(char)
    bitmap = face.glyph.bitmap

    width = bitmap.width
    height = bitmap.rows
    buffer = bitmap.buffer

    matrix = np.zeros((height, width), dtype=int)
    for y in range(height):
        for x in range(width):
            matrix[y, x] = buffer[y * width + x]
    return matrix.tolist()  # 转换为普通列表以便JSON序列化

def generate_char_set_config(font_path, size):
    # 定义要生成的字符集
    digits = '0123456789'
    letters_upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    letters_lower = 'abcdefghijklmnopqrstuvwxyz'
    punctuation = ',.?!;:\'"`~@#$%^&*()-_+=<>[]{}\\|/'
    
    # 创建字符映射
    char_map = {}
    
    # 处理所有字符
    all_chars = digits + letters_upper + letters_lower + punctuation
    for char in all_chars:
        try:
            matrix = get_char_matrix(font_path, char, size)
            char_map[char] = matrix
        except Exception as e:
            print(f"Error processing character '{char}': {e}")
    
    # 获取字体名称
    face = freetype.Face(font_path)
    font_name = face.family_name.decode('utf-8')
    
    # 创建配置文件名
    config_name = f"{font_name}_{size}"
    filename = f"font_configs/{config_name}.json"
    
    # 确保目录存在
    os.makedirs('font_configs', exist_ok=True)
    
    # 保存配置
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump({
            'font_name': font_name,
            'size': size,
            'char_map': char_map
        }, f, indent=2)
    
    return filename

if __name__ == '__main__':
    font_file = "font/Phosphate.ttc"
    size = 12
    
    # 生成配置文件
    config_file = generate_char_set_config(font_file, size)
    print(f"Character set configuration has been saved to: {config_file}")
    
    # 打印示例字符的矩阵
    print("\nExample matrix for 'A':")
    matrix = get_char_matrix(font_file, 'A', size)
    print(np.array(matrix))