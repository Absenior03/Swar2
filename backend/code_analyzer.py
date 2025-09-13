from typing import List, Dict, Any
import re

def debug_regex(pattern: str, text: str) -> None:
    """Helper function to debug regex patterns."""
    print(f"\nDebug regex pattern: {pattern}")
    print(f"Testing against text: {text}")
    match = re.search(pattern, text, re.MULTILINE | re.IGNORECASE)
    if match:
        print(f"Match found! Groups: {match.groups()}")
        print(f"Matched text: {match.group(0)}")
    else:
        print("No match found")

class CodeAnalyzer:
    def __init__(self):
        self.error_patterns = {
            'syntax_error': {
                'js': [
                    # Loop and control structure syntax errors
                    (r'for\s*\(\s*\{', 'Invalid for loop syntax - missing initialization, condition, and increment'),
                    (r'for\s*\([^;]*[^;{]*(?:\{|$)', 'Invalid for loop syntax - missing required components'),
                    (r'for\s*\([^;]*;\s*[^;]*\{', 'Invalid for loop syntax - incomplete structure'),
                    (r'for\s*\([^;]*$', 'Unclosed for loop parenthesis'),
                    (r'for\s*[^(]', 'Missing parentheses in for loop'),
                    (r'for\s*\(\s*;?\s*;?\s*\)', 'Empty for loop condition'),
                    
                    # Missing closure errors
                    (r'[\w.]+\s*\(\s*[^)]*$', 'Unclosed parenthesis'),
                    (r'[\w.]+\s*\{\s*[^}]*$', 'Unclosed curly brace'),
                    (r'[\w.]+\s*\[\s*[^\]]*$', 'Unclosed bracket'),
                    (r'function\s+\w+\s*\([^)]*$', 'Unclosed function parameters'),
                    
                    # Missing semicolon errors
                    (r'(const|let|var)\s+\w+\s*=\s*[^;{]*$', 'Missing semicolon after variable declaration'),
                    (r'[^;{]\s*\n', 'Missing semicolon at line end'),
                    (r'\w+\s*=\s*[^;{]*$', 'Missing semicolon after assignment'),
                    (r'return\s+[^;{]*$', 'Missing semicolon after return'),
                    (r'[)\]]\s*\n', 'Missing semicolon after expression'),
                    
                    # Structural errors
                    (r'\{\s*\n\s*\}', 'Empty block'),
                    (r'\)\s*[^{]*$', 'Missing opening curly brace after function/if/loop'),
                    (r'else[^{]*$', 'Missing block after else'),
                    
                    # Variable reference errors
                    (r'\+\+\s*\d+', 'Invalid increment of literal number'),
                    (r'--\s*\d+', 'Invalid decrement of literal number'),
                    (r'\b(i\s*\+=|\+=\s*i|i\+\+|\+\+i|i\s*=)\b', 'Reference to undefined variable i in loop'),
                    
                    # Common syntax errors
                    (r'=>\s*{[^}]*$', 'Unclosed arrow function body'),
                    (r'new\s+\w+\s*[^(]', 'Missing parentheses after new operator'),
                    (r'catch\s*[^(]', 'Missing parentheses in catch clause'),
                    (r'(if|while|for)\s*[^(]', 'Missing parentheses after control statement'),
                ],
                'go': [
                    (r'func\s+\w+\s*\([^)]*$', 'Unclosed function parameter list'),
                    (r'if\s+[^{]*$', 'Missing curly brace after if condition'),
                    (r'for\s+[^{]*$', 'Missing curly brace after for loop'),
                    (r':=\s*$', 'Incomplete short variable declaration')
                ]
            },
            'logical_error': {
                'js': [
                    (r'for\s*\([^;]*;[^;]*;[^)]*\)\s*{\s*break;?\s*}', 'Potentially incorrect loop with immediate break'),
                    (r'if\s*\([^)]*===\s*null[^)]*\)', 'Use of strict equality with null (consider using == null)'),
                    (r'if\s*\([^)]*=(?!=)[^)]*\)', 'Assignment in condition (possible typo)'),
                    (r'if\s*\([^)]*\)\s*\n\s*else', 'Dangling else statement'),
                    (r'return\s+undefined', 'Explicit return of undefined'),
                    (r'(\w+)\s*=\s*\1', 'Self-assignment detected'),
                    (r'while\s*\(true\)', 'Infinite loop detected'),
                    (r'if\s*\([^)]*\)\s*{\s*}\s*else\s*{\s*}', 'Empty if-else blocks'),
                    (r'switch\s*\([^)]*\)\s*{\s*}', 'Empty switch statement'),
                    (r'catch\s*\([^)]*\)\s*{\s*}', 'Empty catch block')
                ],
                'go': [
                    (r'if\s+err\s*!=\s*nil\s*{\s*return\s+[^}]*}', 'Error handling without logging'),
                    (r'go\s+func\s*\([^)]*\)\s*{\s*[^}]*}', 'Goroutine without error handling'),
                    (r'defer\s+[^(]+\([^)]*\)\s*$', 'Deferred function call without error check')
                ]
            },
            'best_practice': {
                'js': [
                    (r'console\.(log|debug|info|warn|error)\(', 'Debug statement in code'),
                    (r'var\s+', 'Use of var instead of let/const'),
                    (r'==(?!=)', 'Use of loose equality (consider using ===)'),
                    (r'(?:if|for|while)\s*\([^)]*\)[^{]', 'Missing block braces'),
                    (r'with\s*\(', 'Use of with statement (not recommended)'),
                    (r'eval\s*\(', 'Use of eval (security risk)'),
                    (r'new\s+Array\(\)', 'Use [] instead of new Array()'),
                    (r'new\s+Object\(\)', 'Use {} instead of new Object()'),
                    (r'setTimeout\s*\(\s*"', 'String argument in setTimeout/setInterval'),
                    (r'null\s*==\s*undefined', 'Comparing null with undefined')
                ],
                'go': [
                    (r'fmt\.Println\(', 'Debug print statement in code'),
                    (r'time\.Sleep\(', 'Use of time.Sleep (consider proper synchronization)'),
                    (r'panic\(', 'Use of panic (consider error handling)')
                ]
            }
        }

    def analyze_code(self, code: str, language: str) -> List[Dict[str, Any]]:
        issues = []
        print(f"Analyzing {language} code...")
        
        # Split code into lines for line-by-line analysis
        lines = code.split('\n')
        print(f"Code has {len(lines)} lines")
        
        # First check entire code for multi-line patterns
        for error_type, patterns in self.error_patterns.items():
            if language in patterns:
                print(f"Checking for {error_type} patterns...")
                for pattern, message in patterns[language]:
                    try:
                        # Add flags to make patterns more robust
                        matches = re.finditer(pattern, code, re.MULTILINE | re.IGNORECASE)
                        for match in matches:
                            line_number = code[:match.start()].count('\n') + 1
                            matched_text = match.group(0)
                            print(f"Found {error_type} at line {line_number}")
                            print(f"Matched text: {matched_text}")
                            print(f"Message: {message}")
                            
                            # Don't add duplicate issues for the same line and type
                            duplicate = False
                            for issue in issues:
                                if issue['line'] == line_number and issue['type'] == error_type:
                                    duplicate = True
                                    break
                                    
                            if not duplicate:
                                issues.append({
                                    'type': error_type,
                                    'message': message,
                                    'line': line_number,
                                    'severity': self._get_severity(error_type),
                                    'matched_text': matched_text
                                })
                    except Exception as e:
                        print(f"Error processing pattern {pattern}: {str(e)}")
        
        # Then check line by line for single-line patterns
        for line_num, line in enumerate(lines, 1):
            # Skip empty lines and lines that are only whitespace
            if not line.strip():
                continue
                
            print(f"Analyzing line {line_num}: {line[:50]}...")
            
            # Get some context by looking at surrounding lines
            prev_line = lines[line_num - 2] if line_num > 1 else ""
            next_line = lines[line_num] if line_num < len(lines) else ""
            
            # Create a context block for better pattern matching
            context_block = f"{prev_line}\n{line}\n{next_line}"
            
            for error_type, patterns in self.error_patterns.items():
                if language in patterns:
                    for pattern, message in patterns[language]:
                        try:
                            # Check both the single line and the context block
                            matches = []
                            line_match = re.search(pattern, line, re.IGNORECASE)
                            context_match = re.search(pattern, context_block, re.MULTILINE | re.IGNORECASE)
                            
                            if line_match or context_match:
                                # Don't add duplicate issues for the same line and type
                                duplicate = False
                                for issue in issues:
                                    if issue['line'] == line_num and issue['type'] == error_type:
                                        duplicate = True
                                        break
                                        
                                if not duplicate:
                                    print(f"Found {error_type} at line {line_num}")
                                    print(f"Line content: {line}")
                                    print(f"Message: {message}")
                                    issues.append({
                                        'type': error_type,
                                        'message': message,
                                        'line': line_num,
                                        'severity': self._get_severity(error_type),
                                        'matched_text': line.strip()
                                    })
                        except Exception as e:
                            print(f"Error processing pattern {pattern} on line {line_num}: {str(e)}")
        
        print(f"Analysis complete. Found {len(issues)} issues")

        return issues

    def _get_severity(self, error_type: str) -> int:
        severity_map = {
            'syntax_error': 3,    # Highest severity
            'logical_error': 2,   # Medium severity
            'best_practice': 1    # Low severity
        }
        return severity_map.get(error_type, 1)

    def get_musical_mapping(self, issue: Dict[str, Any]) -> Dict[str, Any]:
        """Map code issues to musical parameters."""
        base_mappings = {
            'syntax_error': {
                'note': 'C2',  # Lower octave for serious errors
                'duration': '8n',
                'velocity': 0.8,
                'timbre': 'sawtooth'
            },
            'logical_error': {
                'note': 'E3',  # Middle octave for logical errors
                'duration': '16n',
                'velocity': 0.6,
                'timbre': 'square'
            },
            'best_practice': {
                'note': 'A4',  # Higher octave for warnings
                'duration': '32n',
                'velocity': 0.4,
                'timbre': 'triangle'
            }
        }

        # Get base mapping for the issue type
        mapping = base_mappings.get(issue['type'], base_mappings['best_practice']).copy()
        
        # Modify parameters based on severity
        if issue['severity'] > 2:
            mapping['velocity'] = 1.0  # Increase volume for severe issues
            mapping['duration'] = '4n'  # Longer duration for emphasis
        
        return mapping
