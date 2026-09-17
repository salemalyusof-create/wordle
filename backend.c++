#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <unordered_map>
#include <unordered_set>
#include <map>
#include <algorithm>
#include <random>
#include <chrono>
#include <cctype>
#include <cstdlib>
#include <sstream>

#ifdef _WIN32
    #include <winsock2.h>
    #pragma comment(lib, "ws2_32.lib")
    typedef int socklen_t;
#else
    #include <sys/socket.h>
    #include <netinet/in.h>
    #include <arpa/inet.h>
    #include <unistd.h>
    #define closesocket close
    #define INVALID_SOCKET -1
#endif

using namespace std;

// Global game state map (session ID -> game data)
unordered_map<string, unordered_map<string, string>> games;

// Count UTF-8 characters (not bytes)
static int utf8_strlen(const string& s) {
    int count = 0;
    for(size_t i = 0; i < s.length(); i++) {
        unsigned char c = (unsigned char)s[i];
        // Count characters: skip continuation bytes (10xxxxxx)
        if((c & 0xC0) != 0x80) {
            count++;
        }
    }
    return count;
}

// Get UTF-8 character at position (0-indexed)
static string utf8_char_at(const string& s, int pos) {
    int char_count = 0;
    for(size_t i = 0; i < s.length(); ) {
        if(char_count == pos) {
            unsigned char c = (unsigned char)s[i];
            if(c < 0x80) {
                return s.substr(i, 1);
            } else if(c < 0xE0) {
                return s.substr(i, 2);
            } else if(c < 0xF0) {
                return s.substr(i, 3);
            } else {
                return s.substr(i, 4);
            }
        }
        
        unsigned char c = (unsigned char)s[i];
        if(c < 0x80) i += 1;
        else if(c < 0xE0) i += 2;
        else if(c < 0xF0) i += 3;
        else i += 4;
        char_count++;
    }
    return "";
}

// UTF-8 aware lowercase with Turkish letter support
static string tolower_utf8(const string& s) {
    string result;
    for(size_t i = 0; i < s.length(); i++) {
        unsigned char c = (unsigned char)s[i];
        
        // Handle Turkish letters (UTF-8 encoded)
        if(i + 1 < s.length()) {
            unsigned char c1 = (unsigned char)s[i];
            unsigned char c2 = (unsigned char)s[i + 1];
            
            // Turkish uppercase to lowercase mappings
            // Ç (C387) -> ç (C3A7)
            if(c1 == 0xC3 && c2 == 0x87) {  // Ç
                result += "\xC3\xA7";  // ç
                i++;
                continue;
            }
            // Ğ (C49E) -> ğ (C49F)
            if(c1 == 0xC4 && c2 == 0x9E) {  // Ğ
                result += "\xC4\x9F";  // ğ
                i++;
                continue;
            }
            // I (C4B0) -> ı (C4B1) - Turkish i without dot
            if(c1 == 0xC4 && c2 == 0xB0) {  // Ι
                result += "\xC4\xB1";  // ι
                i++;
                continue;
            }
            // Ö (C396) -> ö (C3B6)
            if(c1 == 0xC3 && c2 == 0x96) {  // Ö
                result += "\xC3\xB6";  // ö
                i++;
                continue;
            }
            // Ş (C59E) -> ş (C59F)
            if(c1 == 0xC5 && c2 == 0x9E) {  // Ş
                result += "\xC5\x9F";  // ş
                i++;
                continue;
            }
            // Ü (C39C) -> ü (C3BC)
            if(c1 == 0xC3 && c2 == 0x9C) {  // Ü
                result += "\xC3\xBC";  // ü
                i++;
                continue;
            }
        }
        
        // Standard ASCII lowercase
        if(c >= 'A' && c <= 'Z') {
            result += (char)(c + 32);
        } else {
            result += c;
        }
    }
    return result;
}

static string tolower_str(string s){
    return tolower_utf8(s);
}

// Case-insensitive string comparison for UTF-8 strings
static bool caseInsensitiveCompare(const string& a, const string& b) {
    string a_lower = tolower_utf8(a);
    string b_lower = tolower_utf8(b);
    return a_lower == b_lower;
}

vector<string> loadWords(const string& language) {
    vector<string> words;
    string wordFile = (language == "turkish") ? "turkishwordlist.txt" : "englishwordlist.txt";
    
    ifstream f(wordFile);
    if(f){
        string w;
        while(getline(f,w)){
            if(w.size()==0) continue;
            while(!w.empty() && isspace((unsigned char)w.back())) w.pop_back();
            while(!w.empty() && isspace((unsigned char)w.front())) w.erase(w.begin());
            // Check character count, not byte count
            if(utf8_strlen(w) == 5){
                words.push_back(w);
            }
        }
    }
    if(words.empty()){
        if(language == "turkish"){
            words = {"elmas","cadde","camci","edebi","fakat","istek"};
        } else {
            words = {"apple","berry","champ","crane","slate","crazy","plant","brave","shine","ghost","pride","quick","roast","bloom","frame","grace","might","north","sweet","voice","zebra"};
        }
    }
    return words;
}

string generateSessionId() {
    static int counter = 0;
    return "sess_" + to_string(chrono::high_resolution_clock::now().time_since_epoch().count()) + "_" + to_string(counter++);
}

string pickRandomWord(const vector<string>& words) {
    if(words.empty()) return "APPLE";
    mt19937_64 rng(chrono::high_resolution_clock::now().time_since_epoch().count());
    return words[rng() % words.size()];
}

vector<string> evaluateGuess(const string& guess, const string& secret) {
    vector<string> result(5, "absent");
    
    // Convert to lowercase for comparison
    string guess_lower = tolower_utf8(guess);
    string secret_lower = tolower_utf8(secret);
    
    // Mark correct positions
    vector<bool> used(5, false);
    for(int i = 0; i < 5; i++){
        string guess_char = utf8_char_at(guess_lower, i);
        string secret_char = utf8_char_at(secret_lower, i);
        if(guess_char == secret_char){ 
            result[i] = "correct"; 
            used[i] = true; 
        }
    }
    
    // Count remaining letters in secret
    map<string, int> cnt;
    for(int i = 0; i < 5; i++){
        if(!used[i]) {
            cnt[utf8_char_at(secret_lower, i)]++;
        }
    }
    
    // Mark present letters
    for(int i = 0; i < 5; i++){
        if(result[i] == "correct") continue;
        
        string letter = utf8_char_at(guess_lower, i);
        if(cnt[letter] > 0){ 
            result[i] = "present"; 
            cnt[letter]--; 
        }
    }
    
    return result;
}

string jsonEscape(const string& s) {
    string result;
    for(char c : s) {
        if(c == '"') result += "\\\"";
        else if(c == '\\') result += "\\\\";
        else if(c == '\n') result += "\\n";
        else if(c == '\r') result += "\\r";
        else result += c;
    }
    return result;
}

// URL decode function for handling %XX encoded characters
string urlDecode(const string& encoded) {
    string decoded;
    for(size_t i = 0; i < encoded.length(); i++) {
        if(encoded[i] == '%' && i + 2 < encoded.length()) {
            string hex = encoded.substr(i + 1, 2);
            char val = (char)stoi(hex, nullptr, 16);
            decoded += val;
            i += 2;
        } else if(encoded[i] == '+') {
            decoded += ' ';
        } else {
            decoded += encoded[i];
        }
    }
    return decoded;
}

string handleRequest(const string& method, const string& path, const string& body) {
    // Parse query string
    unordered_map<string, string> query;
    size_t qpos = path.find('?');
    string pathname = (qpos != string::npos) ? path.substr(0, qpos) : path;
    
    if(qpos != string::npos) {
        string qs = path.substr(qpos + 1);
        stringstream ss(qs);
        string param;
        while(getline(ss, param, '&')) {
            size_t epos = param.find('=');
            if(epos != string::npos) {
                query[param.substr(0, epos)] = param.substr(epos + 1);
            }
        }
    }

    string response = "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\n";

    if(pathname == "/" || pathname == "/index.html") {
        response = "HTTP/1.1 200 OK\r\nContent-Type: text/html\r\n";
        response += "Access-Control-Allow-Origin: *\r\n\r\n";
        response += "Backend API running at /api/*\n";
        return response;
    }

    // API endpoints
    if(pathname == "/api/init") {
        string language = query.count("lang") ? query["lang"] : "english";
        vector<string> words = loadWords(language);
        string sessionId = generateSessionId();
        string secret = pickRandomWord(words);
        
        games[sessionId]["secret"] = secret;
        games[sessionId]["language"] = language;
        games[sessionId]["attempts"] = "0";
        games[sessionId]["hints"] = "0";
        games[sessionId]["revealed"] = "";
        
        response += "Access-Control-Allow-Origin: *\r\n\r\n";
        response += "{\"sessionId\":\"" + jsonEscape(sessionId) + "\",\"message\":\"Game initialized\"}";
        return response;
    }

    if(pathname == "/api/words") {
        string language = query.count("lang") ? query["lang"] : "english";
        vector<string> words = loadWords(language);
        
        response += "Access-Control-Allow-Origin: *\r\n\r\n";
        response += "{\"words\":[";
        for(size_t i = 0; i < words.size(); i++) {
            response += "\"" + jsonEscape(words[i]) + "\"";
            if(i < words.size() - 1) response += ",";
        }
        response += "]}";
        return response;
    }

    if(pathname == "/api/secret") {
        string sessionId = query.count("sid") ? query["sid"] : "";
        string adminEmail = query.count("adminEmail") ? urlDecode(query["adminEmail"]) : "";
        if(sessionId.empty() || games.find(sessionId) == games.end()) {
            response += "Access-Control-Allow-Origin: *\r\n\r\n";
            response += "{\"error\":\"Invalid session\"}";
            return response;
        }

        if(adminEmail != "salemalyusof@gmail.com") {
            response = "HTTP/1.1 403 Forbidden\r\nContent-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\n\r\n";
            response += "{\"error\":\"Administrator access required\"}";
            return response;
        }

        string secret = games[sessionId]["secret"];
        response += "Access-Control-Allow-Origin: *\r\n\r\n";
        response += "{\"secret\":\"" + jsonEscape(secret) + "\"}";
        return response;
    }

    if(pathname == "/api/hint") {
        string sessionId = query.count("sid") ? query["sid"] : "";
        if(sessionId.empty() || games.find(sessionId) == games.end()) {
            response += "Access-Control-Allow-Origin: *\r\n\r\n";
            response += "{\"error\":\"Invalid session\"}";
            return response;
        }

        auto& game = games[sessionId];
        int hintCount = stoi(game["hints"]);
        if(hintCount >= 2) {
            response += "Access-Control-Allow-Origin: *\r\n\r\n";
            response += "{\"error\":\"No hints remaining\"}";
            return response;
        }

        string secret = game["secret"];
        string revealed = game["revealed"];
        unordered_set<int> excluded;
        if(query.count("exclude")) {
            string excludedPositions = query["exclude"];
            string position;
            stringstream positions(excludedPositions);
            while(getline(positions, position, ',')) {
                try {
                    int index = stoi(position);
                    if(index >= 0 && index < 5) excluded.insert(index);
                } catch(...) {
                    // Ignore malformed position values.
                }
            }
        }

        vector<int> candidates;
        for(int i = 0; i < 5; i++) {
            if(revealed.find(to_string(i)) == string::npos && !excluded.count(i)) candidates.push_back(i);
        }

        if(candidates.empty()) {
            response += "Access-Control-Allow-Origin: *\r\n\r\n";
            response += "{\"error\":\"All letters are already revealed\"}";
            return response;
        }

        mt19937 rng(static_cast<unsigned int>(chrono::steady_clock::now().time_since_epoch().count()));
        shuffle(candidates.begin(), candidates.end(), rng);
        int selected = candidates.front();

        game["hints"] = to_string(hintCount + 1);
        game["revealed"] += to_string(selected);
        string letter = utf8_char_at(secret, selected);
        response += "Access-Control-Allow-Origin: *\r\n\r\n";
        response += "{\"position\":" + to_string(selected) + ",\"letter\":\"" + jsonEscape(letter) + "\",\"remaining\":" + to_string(1 - hintCount) + "}";
        return response;
    }

    if(pathname == "/api/guess") {
        string sessionId = query.count("sid") ? query["sid"] : "";
        string guess = query.count("guess") ? urlDecode(query["guess"]) : "";
        
        if(sessionId.empty() || games.find(sessionId) == games.end()) {
            response += "Access-Control-Allow-Origin: *\r\n\r\n";
            response += "{\"error\":\"Invalid session\"}";
            return response;
        }

        if(utf8_strlen(guess) != 5) {
            response += "Access-Control-Allow-Origin: *\r\n\r\n";
            response += "{\"error\":\"Guess must be 5 letters\"}";
            return response;
        }

        string secret = games[sessionId]["secret"];
        vector<string> result = evaluateGuess(guess, secret);
        int attempts = stoi(games[sessionId]["attempts"]) + 1;
        games[sessionId]["attempts"] = to_string(attempts);

        bool won = result[0] == "correct" && result[1] == "correct" && 
                   result[2] == "correct" && result[3] == "correct" && result[4] == "correct";
        
        response += "Access-Control-Allow-Origin: *\r\n\r\n";
        response += "{\"guess\":\"" + jsonEscape(guess) + "\",\"result\":[";
        for(int i = 0; i < 5; i++) {
            response += "\"" + result[i] + "\"";
            if(i < 4) response += ",";
        }
        response += "],\"won\":" + (won ? string("true") : string("false"));
        response += ",\"attempts\":" + to_string(attempts);
        response += ",\"gameOver\":" + (won || attempts >= 6 ? string("true") : string("false")) + "}";
        return response;
    }

    if(pathname == "/api/validate") {
        string language = query.count("lang") ? query["lang"] : "english";
        string guess = query.count("word") ? urlDecode(query["word"]) : "";
        
        vector<string> words = loadWords(language);
        bool valid = false;
        for(const string& word : words) {
            if(caseInsensitiveCompare(word, guess)) {
                valid = true;
                break;
            }
        }
        
        response += "Access-Control-Allow-Origin: *\r\n\r\n";
        response += "{\"valid\":" + (valid ? string("true") : string("false")) + "}";
        return response;
    }

    response += "Access-Control-Allow-Origin: *\r\n\r\n";
    response += "{\"error\":\"Endpoint not found\"}";
    return response;
}

int main() {
#ifdef _WIN32
    WSADATA wsa;
    WSAStartup(MAKEWORD(2, 2), &wsa);
#endif

    SOCKET server = socket(AF_INET, SOCK_STREAM, 0);
    if(server == INVALID_SOCKET) {
        cerr << "Socket creation error\n";
        return 1;
    }

    sockaddr_in addr = {};
    addr.sin_family = AF_INET;
    addr.sin_addr.s_addr = inet_addr("127.0.0.1");
    addr.sin_port = htons(8080);

    if(bind(server, (sockaddr*)&addr, sizeof(addr)) < 0) {
        cerr << "Bind failed\n";
        return 1;
    }

    listen(server, 5);
    cerr << "Wordle backend server running on http://127.0.0.1:8080\n";

    while(true) {
        sockaddr_in client_addr = {};
        socklen_t client_len = sizeof(client_addr);
        
#ifdef _WIN32
        SOCKET client = accept(server, (sockaddr*)&client_addr, &client_len);
#else
        int client = accept(server, (sockaddr*)&client_addr, &client_len);
#endif
        
        if(client == INVALID_SOCKET) continue;

        char buffer[4096] = {0};
        int n = recv(client, buffer, sizeof(buffer) - 1, 0);
        if(n > 0) {
            buffer[n] = 0;
            string request(buffer);
            
            string method, path;
            stringstream ss(request);
            ss >> method >> path;

            string response = handleRequest(method, path, "");
            send(client, response.c_str(), response.size(), 0);
        }

        closesocket(client);
    }

    closesocket(server);
    return 0;
}
