from typing import List, Dict, Any
import re
import ast
import traceback

class EnhancedCodeAnalyzer:
    """Enhanced code analyzer with better error detection and more error types"""
    
    def __init__(self):
        self.error_patterns = {
            'syntax_error': {
                'js': [
                    # Missing semicolon patterns
                    (r'(const|let|var)\s+\w+\s*=\s*[^;{]*[^;]\s*$', 'Missing semicolon after variable declaration'),
                    (r'\w+\s*=\s*[^;{]*[^;]\s*$', 'Missing semicolon after assignment'),
                    (r'return\s+[^;{]*[^;]\s*$', 'Missing semicolon after return statement'),
                    
                    # Unclosed brackets/parentheses
                    (r'\([^)]*$', 'Unclosed parenthesis'),
                    (r'\{[^}]*$', 'Unclosed curly brace'),
                    (r'\[[^\]]*$', 'Unclosed square bracket'),
                    
                    # Missing operators
                    (r'for\s*\([^;]*;[^;]*\{', 'Incomplete for loop - missing increment'),
                    (r'for\s*\([^;]*\{', 'Incomplete for loop - missing condition and increment'),
                    (r'for\s*\(\s*\{', 'Invalid for loop - missing all components'),
                    
                    # Function declaration errors
                    (r'function\s+\w+\s*\([^)]*$', 'Unclosed function parameter list'),
                    (r'function\s+\w+\s*\(\s*\)\s*$', 'Function missing body'),
                    
                    # Control structure errors
                    (r'(if|while|for)\s+[^(]', 'Missing parentheses after control keyword'),
                    (r'(if|while)\s*\([^)]*\)\s*$', 'Control statement missing body'),
                    
                    # String and quote errors
                    (r'"[^"]*$', 'Unclosed double quote'),
                    (r"'[^']*$", 'Unclosed single quote'),
                    (r'`[^`]*$', 'Unclosed template literal'),
                ],
                'python': [
                    # Indentation errors (basic detection)
                    (r'^\s*(if|for|while|def|class|try|except|finally|with).*:\s*$', 'Statement missing body (next line should be indented)'),
                    (r'^\s*(return|break|continue|pass)\s+\w+', 'Unexpected token after control statement'),
                    
                    # Missing colons
                    (r'^\s*(if|for|while|def|class|try|except|finally|with|else|elif).*[^:]\s*$', 'Missing colon after statement'),
                    
                    # Parentheses errors
                    (r'\([^)]*$', 'Unclosed parenthesis'),
                    (r'\[[^\]]*$', 'Unclosed square bracket'),
                    (r'\{[^}]*$', 'Unclosed curly brace'),
                    
                    # String errors
                    (r'"[^"]*$', 'Unclosed double quote'),
                    (r"'[^']*$", 'Unclosed single quote'),
                    (r'"""[^"]*$', 'Unclosed triple quote'),
                ]
            },
            'logical_error': {
                'js': [
                    # Infinite loops
                    (r'while\s*\(\s*true\s*\)', 'Potential infinite loop'),
                    (r'for\s*\(\s*;\s*;\s*\)', 'Infinite for loop'),
                    
                    # Assignment in conditions
                    (r'if\s*\([^)]*=(?!=)[^)]*\)', 'Assignment in condition (use == for comparison)'),
                    (r'while\s*\([^)]*=(?!=)[^)]*\)', 'Assignment in while condition'),
                    
                    # Empty blocks
                    (r'(if|else|for|while|try|catch|finally)\s*[^{]*\{\s*\}', 'Empty control block'),
                    (r'function\s+\w+\s*\([^)]*\)\s*\{\s*\}', 'Empty function body'),
                    
                    # Unreachable code patterns
                    (r'return\s*[^;]*;\s*\w+', 'Unreachable code after return'),
                    (r'throw\s*[^;]*;\s*\w+', 'Unreachable code after throw'),
                    
                    # Comparison issues
                    (r'(\w+)\s*===?\s*\1(?!\w)', 'Self-comparison detected'),
                    (r'==\s*null', 'Use strict equality (===) with null'),
                    
                    # Loop issues
                    (r'for\s*\([^;]*;\s*[^;]*;\s*\)\s*\{\s*break\s*;\s*\}', 'Loop with immediate break'),
                ],
                'python': [
                    # Infinite loops
                    (r'while\s+True\s*:', 'Potential infinite loop'),
                    
                    # Empty blocks
                    (r'(if|else|for|while|try|except|finally|def|class).*:\s*$', 'Empty block (missing pass statement)'),
                    
                    # Assignment in conditions (Python 3.8+ walrus operator aside)
                    (r'if\s+\w+\s*=\s*[^=]', 'Assignment in if statement (use == for comparison)'),
                    
                    # Common mistakes
                    (r'(\w+)\s*==\s*\1(?!\w)', 'Self-comparison detected'),
                    (r'is\s+True|is\s+False', 'Use == instead of is for boolean comparison'),
                    (r'len\(\w+\)\s*==\s*0', 'Use "not list" instead of "len(list) == 0"'),
                ]
            },
            'runtime_error': {
                'js': [
                    # Potential null/undefined access
                    (r'\w+\.\w+\s*\(\)', 'Potential null/undefined method call'),
                    (r'\w+\[\w+\]', 'Potential undefined array/object access'),
                    
                    # Division by zero
                    (r'/\s*0(?!\w)', 'Division by zero'),
                    (r'/\s*\(\s*\w+\s*-\s*\w+\s*\)', 'Potential division by zero'),
                    
                    # Type errors
                    (r'\+\s*undefined|\+\s*null', 'Addition with undefined/null'),
                    (r'parseInt\([^,)]+\)', 'parseInt without radix parameter'),
                ],
                'python': [
                    # Division by zero
                    (r'/\s*0(?!\w)', 'Division by zero'),
                    
                    # Index errors
                    (r'\w+\[-1\]', 'Negative index access (check list length)'),
                    (r'\w+\[\d+\]', 'Hard-coded index access (potential IndexError)'),
                    
                    # Key errors
                    (r'\w+\[[\'"]\w+[\'"]\]', 'Dictionary key access without error handling'),
                    
                    # Import errors
                    (r'from\s+\w+\s+import\s+\*', 'Wildcard import (can cause namespace issues)'),
                ]
            },
            'best_practice': {
                'js': [
                    # Old JavaScript patterns
                    (r'var\s+', 'Use let or const instead of var'),
                    (r'==(?!=)', 'Use strict equality (===) instead of =='),
                    (r'!=(?!=)', 'Use strict inequality (!==) instead of !='),
                    
                    # Debug statements
                    (r'console\.(log|debug|info|warn|error)\s*\(', 'Remove debug console statement'),
                    (r'alert\s*\(', 'Remove alert statement'),
                    (r'debugger\s*;', 'Remove debugger statement'),
                    
                    # Performance issues
                    (r'new\s+Array\(\)', 'Use [] instead of new Array()'),
                    (r'new\s+Object\(\)', 'Use {} instead of new Object()'),
                    
                    # Security issues
                    (r'eval\s*\(', 'Avoid eval() - security risk'),
                    (r'innerHTML\s*=', 'Potential XSS vulnerability with innerHTML'),
                    
                    # Code style
                    (r'if\s*\([^)]+\)\s*\w+', 'Use braces for single-line if statements'),
                ],
                'python': [
                    # Debug statements
                    (r'print\s*\(', 'Remove debug print statement'),
                    
                    # Performance issues
                    (r'\+\s*=\s*\[\w+\]', 'Use list.append() instead of += for single items'),
                    (r'range\(len\(\w+\)\)', 'Use enumerate() instead of range(len())'),
                    
                    # Style issues
                    (r'lambda\s+[^:]+:\s*[^,\n]+,', 'Complex lambda - consider using def'),
                    (r'except\s*:', 'Bare except clause - specify exception type'),
                    
                    # Import style
                    (r'import\s+\w+\s*,', 'Multiple imports on one line - use separate lines'),
                ]
            }
        }
    
    def analyze_code(self, code: str, language: str) -> List[Dict[str, Any]]:
        """Enhanced code analysis with multiple error detection methods"""
        issues = []
        
        # First, try syntax validation for Python
        if language.lower() in ['python', 'py']:
            syntax_issues = self._check_python_syntax(code)
            issues.extend(syntax_issues)
        
        # Run pattern-based analysis
        pattern_issues = self._pattern_based_analysis(code, language)
        issues.extend(pattern_issues)
        
        # Remove duplicates based on line number and type
        unique_issues = []
        seen = set()
        for issue in issues:
            key = (issue['line'], issue['type'])
            if key not in seen:
                seen.add(key)
                unique_issues.append(issue)
        
        return sorted(unique_issues, key=lambda x: x['line'])
    
    def _check_python_syntax(self, code: str) -> List[Dict[str, Any]]:
        """Check Python syntax using AST parser"""
        issues = []
        try:
            ast.parse(code)
        except SyntaxError as e:
            issues.append({
                'type': 'syntax_error',
                'message': f'Python syntax error: {e.msg}',
                'line': e.lineno or 1,
                'severity': 3,
                'matched_text': ''
            })
        except Exception as e:
            issues.append({
                'type': 'syntax_error', 
                'message': f'Parse error: {str(e)}',
                'line': 1,
                'severity': 3,
                'matched_text': ''
            })
        return issues
    
    def _pattern_based_analysis(self, code: str, language: str) -> List[Dict[str, Any]]:
        """Pattern-based error detection"""
        issues = []
        lines = code.split('\n')
        
        # Map language variants
        lang_key = language.lower()
        if lang_key in ['js', 'javascript']:
            lang_key = 'js'
        elif lang_key in ['py', 'python']:
            lang_key = 'python'
        
        for error_type, patterns in self.error_patterns.items():
            if lang_key not in patterns:
                continue
                
            for pattern, message in patterns[lang_key]:
                try:
                    # Check entire code for multi-line patterns
                    for match in re.finditer(pattern, code, re.MULTILINE | re.IGNORECASE):
                        line_number = code[:match.start()].count('\n') + 1
                        issues.append({
                            'type': error_type,
                            'message': message,
                            'line': line_number,
                            'severity': self._get_severity(error_type),
                            'matched_text': match.group(0)[:50]  # Limit length
                        })
                    
                    # Check line by line for better context
                    for line_num, line in enumerate(lines, 1):
                        if re.search(pattern, line, re.IGNORECASE):
                            # Avoid duplicates from multi-line check
                            if not any(issue['line'] == line_num and issue['type'] == error_type for issue in issues):
                                issues.append({
                                    'type': error_type,
                                    'message': message,
                                    'line': line_num,
                                    'severity': self._get_severity(error_type),
                                    'matched_text': line.strip()[:50]
                                })
                except Exception as e:
                    print(f"Error processing pattern {pattern}: {e}")
        
        return issues
    
    def _get_severity(self, error_type: str) -> int:
        """Get severity level for error type"""
        severity_map = {
            'syntax_error': 3,      # Critical
            'runtime_error': 3,     # Critical  
            'logical_error': 2,     # High
            'best_practice': 1      # Low
        }
        return severity_map.get(error_type, 1)
    
    def get_musical_mapping(self, issue: Dict[str, Any]) -> Dict[str, Any]:
        """Enhanced musical mapping with more variety"""
        base_mappings = {
            'syntax_error': {
                'note': 'C2',
                'duration': '4n',
                'velocity': 0.9,
                'timbre': 'sawtooth'
            },
            'runtime_error': {
                'note': 'D2', 
                'duration': '4n',
                'velocity': 0.8,
                'timbre': 'square'
            },
            'logical_error': {
                'note': 'E3',
                'duration': '8n',
                'velocity': 0.6,
                'timbre': 'triangle'
            },
            'best_practice': {
                'note': 'A4',
                'duration': '16n',
                'velocity': 0.4,
                'timbre': 'sine'
            }
        }
        
        mapping = base_mappings.get(issue['type'], base_mappings['best_practice']).copy()
        
        # Adjust based on severity
        if issue['severity'] >= 3:
            mapping['velocity'] = min(1.0, mapping['velocity'] + 0.2)
            mapping['duration'] = '2n'  # Longer for critical errors
        
        return mapping