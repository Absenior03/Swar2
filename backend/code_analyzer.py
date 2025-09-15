from tree_sitter import Language, Parser
from typing import Iterator, Dict, Any, List
import re

# --- Tree-sitter Setup ---
LANG_LIB_PATH = './build/languages.so'
GO_LANGUAGE = Language(LANG_LIB_PATH, 'go')
JS_LANGUAGE = Language(LANG_LIB_PATH, 'javascript')

go_parser = Parser()
go_parser.set_language(GO_LANGUAGE)
js_parser = Parser()
js_parser.set_language(JS_LANGUAGE)

def analyze_code_with_tree_sitter(code: str, language: str) -> Iterator[Dict[str, Any]]:
    """
    Analyzes code using Tree-sitter to find both structural nodes and syntax errors.
    """
    parser = js_parser if language == 'javascript' else go_parser
    tree = parser.parse(bytes(code, "utf8"))
    cursor = tree.walk()
    processed_error_lines = set()

    while True:
        node = cursor.node
        if node.type == 'ERROR':
            line_num = node.start_point[0] + 1
            if line_num not in processed_error_lines:
                yield {
                    "type": "syntax_error",
                    "startLine": line_num,
                    "endLine": node.end_point[0] + 1,
                    "isError": True,
                    "message": "Syntax error detected by parser."
                }
                processed_error_lines.add(line_num)
        else:
            yield {
                "type": node.type,
                "startLine": node.start_point[0] + 1,
                "endLine": node.end_point[0] + 1,
                "isError": False,
                "message": ""
            }
        if not (cursor.goto_first_child() or cursor.goto_next_sibling()):
            while cursor.goto_parent():
                if cursor.goto_next_sibling():
                    break
            else:
                return


def analyze_structure(code: str, parser: Parser):
    """
    Parses the given code string using tree-sitter and yields data for each 
    significant structural node. This forms the main melody.
    """
    tree = parser.parse(bytes(code, "utf8"))
    cursor = tree.walk()
    nodes_to_visit = [cursor.node]
    
    while nodes_to_visit:
        node = nodes_to_visit.pop(0)
        
        # We only yield significant structural nodes for the main melody,
        # not every single token. Errors are handled by the class below.
        significant_types = [
            'function_declaration', 'arrow_function', 'for_statement', 
            'while_statement', 'if_statement', 'return_statement', 
            'call_expression', 'variable_declarator'
        ]

        if node.type in significant_types and not node.has_error:
            yield {
                "type": node.type,
                "startLine": node.start_point[0] + 1,
                "endLine": node.end_point[0] + 1,
                "isError": False,
                "message": f"Node type: {node.type}"
            }

        if not node.has_error:
            for child in reversed(node.children):
                nodes_to_visit.insert(0, child)

# --- Your Regex-based Issue Analyzer ---
# This is your class, which we will use to find specific issues.

class CodeAnalyzer:
    def __init__(self):
        self.error_patterns = {
            'syntax_error': {
                'js': [
                    (r'for\s*\(\s*\{', 'Invalid for loop syntax'),
                    (r'for\s*\([^;]*[^;{]*(?:\{|$)', 'Incomplete for loop'),
                    (r'[\w.]+\s*\(\s*[^)]*$', 'Unclosed parenthesis'),
                    (r'[\w.]+\s*\{\s*[^}]*$', 'Unclosed curly brace'),
                    (r'function\s+\w+\s*\([^)]*$', 'Unclosed function parameters'),
                    (r'(const|let|var)\s+\w+\s*=\s*[^;{]*$', 'Missing semicolon'),
                ],
                'go': [
                    (r'func\s+\w+\s*\([^)]*$', 'Unclosed function parameter list'),
                    (r'if\s+[^{]*$', 'Missing curly brace after if'),
                    (r'for\s+[^{]*$', 'Missing curly brace after for'),
                ]
            },
            'logical_error': {
                'js': [
                    (r'if\s*\([^)]*=(?!=)[^)]*\)', 'Assignment in condition (use == or ===)'),
                    (r'while\s*\(true\)', 'Infinite loop detected'),
                    (r'(\w+)\s*=\s*\1', 'Self-assignment detected'),
                ],
                'go': [
                    (r'if\s+err\s*!=\s*nil\s*{\s*return\s+[^}]*}', 'Error handling without logging'),
                ]
            },
            'best_practice': {
                'js': [
                    (r'console\.(log|debug|info|warn|error)\(', 'Debug statement found'),
                    (r'var\s+', 'Use of var (let/const is preferred)'),
                    (r'==(?!=)', 'Use of loose equality (=== is preferred)'),
                ],
                'go': [
                    (r'fmt\.Println\(', 'Debug print statement found'),
                    (r'panic\(', 'Use of panic (consider returning an error)'),
                ]
            }
        }

    def analyze_code(self, code: str, language: str) -> List[Dict[str, Any]]:
        issues = []
        lines = code.split('\n')
        
        for error_type, patterns_by_lang in self.error_patterns.items():
            if language in patterns_by_lang:
                for pattern, message in patterns_by_lang[language]:
                    try:
                        for line_num, line in enumerate(lines, 1):
                            if re.search(pattern, line):
                                # Avoid adding duplicate issues for the same line
                                if not any(i['startLine'] == line_num and i['message'] == message for i in issues):
                                    issues.append({
                                        'type': error_type,
                                        'message': message,
                                        'startLine': line_num,
                                        'endLine': line_num,
                                        'isError': True
                                    })
                    except Exception as e:
                        print(f"Error processing pattern {pattern}: {str(e)}")
        return issues

