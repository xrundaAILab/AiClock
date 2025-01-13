import json
import numpy as np

class MatrixDisplay:
    def __init__(self, config_file):
        # 加载字体配置文件
        with open(config_file, 'r', encoding='utf-8') as f:
            self.config = json.load(f)
        
        # 获取字符映射
        self.char_map = self.config['char_map']
    
    def get_char_needles(self, char):
        """获取字符对应的表针角度矩阵"""
        if char not in self.char_map:
            print(f"Character '{char}' not found in config")
            return None
        
        # 获取字符的灰度矩阵
        gray_matrix = np.array(self.char_map[char])
        height, width = gray_matrix.shape
        
        # 创建表针角度矩阵
        needle_matrix = []
        
        # 添加调试信息
        print(f"\nGray values for character '{char}':")
        print(gray_matrix)
        
        for row in range(height):
            needle_row = []
            for col in range(width):
                gray_value = gray_matrix[row, col]
                # 打印每个位置的灰度值和对应的角度
                print(f"Position [{row},{col}] - Gray value: {gray_value}")
                
                if gray_value > 200:
                    angles = [np.pi/2, 0]
                    print(f"  -> High intensity: Vertical needles")
                elif gray_value > 100:
                    angles = [np.pi/4, 3*np.pi/4]
                    print(f"  -> Medium intensity: 45-degree needles")
                else:
                    angles = [0, np.pi/2]
                    print(f"  -> Low intensity: Horizontal needles")
                
                needle_row.append(angles)
            needle_matrix.append(needle_row)
        
        return {
            'matrix': np.array(needle_matrix),
            'shape': (height, width),
            'gray_matrix': gray_matrix.tolist()  # 添加原始灰度值到返回数据
        }

    def get_display_info(self, char):
        """获取显示信息，包括矩阵尺寸和表针角度"""
        needles = self.get_char_needles(char)
        if needles is None:
            return None
        
        print(f"\nDisplay info for character '{char}':")
        print(f"Matrix shape: {needles['shape']}")
        print("\nNeedle angles matrix:")
        print(needles['matrix'])
        return needles

if __name__ == '__main__':
    # 使用示例
    display = MatrixDisplay('font_configs/Phosphate_12.json')
    
    # 测试一些字符
    test_chars = ['A', '1', '0']
    for char in test_chars:
        display.get_display_info(char) 