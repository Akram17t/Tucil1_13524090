#include <bits/stdc++.h>
using namespace std;
#include <chrono>

char grid[100][100];
long long n, iterasi, waktu;
bool ada[100][100], solusi, frek[26], col[100];
auto lastUpdate = chrono::steady_clock::now();
bool cek();

void printgrid(){
    for (int i = 0; i < n; i++){
        for (int j = 0; j < n; j++){
            if (ada[i][j]) cout << "#";
            else cout << grid[i][j];
        }
        cout << endl;
    }
}

void fungsi(int x){
    auto now = chrono::steady_clock::now();
    if (chrono::duration_cast<chrono::milliseconds>(now - lastUpdate).count() >= 50) {
        lastUpdate = now;
        string line = "ITER:" + to_string(iterasi) + ":";
        for (int i = 0; i < n; i++){
            if (i > 0) line += "|";
            for (int j = 0; j < n; j++){
                if (ada[i][j]) line += "#";
                else line += grid[i][j];
            }
        }
        line += "\n";
        fwrite(line.c_str(), 1, line.size(), stderr);
        fflush(stderr);
    }

    if (x == n){
        iterasi++;

        solusi = cek();
        if (solusi == true) { 
            printgrid(); 
            return; 
        }
        return;
    }

    for (int i = 0; i < n; i++){
        if (solusi) return;
        if (col[i]) continue; // agar tidak ada queen di kolom yg sama (optimasi agar kompleksitas n! bukan n^2)

        ada[x][i] = true;
        col[i] = true;
        fungsi(x + 1);
        if (solusi) return;
        ada[x][i] = false;
        col[i] = false;
    }
}

bool cek(){
    for (int x = 0; x < n; x++){
        int y = -1;
        for (int j = 0; j < n; j++){ // y -> ambil kolom yg ada queen nya
            if (ada[x][j]){ 
                y = j; 
                break; 
            }
        }
        char warna = grid[x][y];
        for (int i = 0; i < x; i++){
            for (int j = 0; j < n; j++){
                // Jika ada warna sama atau Ada tetangga baik diagonal maupun berbatasan langsung
                if (ada[i][j] && (warna == grid[i][j] || (abs(x-i) <= 1 && abs(y-j) <= 1))){ 
                    return false;
                }
            }
        }
    }
    return true;
}

int main()
{
    string st;
    cin >> st;
    n = st.length();
    for (int i = 0; i < n; i++){
        grid[0][i] = st[i];
        ada[0][i] = false;
        col[i] = false;
    }
    for (int i = 1; i < n; i++){
        string s;
        cin >> s;
        for (int j = 0; j < n; j++){
            grid[i][j] = s[j];
            ada[i][j] = false;
        }
    }
    
    auto mulai = chrono::high_resolution_clock::now();

    // cek jumlah warna
    memset(frek, 0, sizeof(frek));
    int cnt = 0;
    for (int i = 0; i < n; i++){
        for (int j = 0; j < n; j++){
            if (frek[grid[i][j] - 'A'] == 0) {
                frek[grid[i][j] - 'A'] = 1;
                cnt++;
            }
        }   
    }
    cout << endl;
    if (cnt != n){
        cout << "Tidak Ada Solusi YAng Memenuhi" << endl;
        return 0;
    }
  
    iterasi = 0;
    solusi = false;

    fungsi(0);
    
    if (!solusi){
        cout << "Tidak Ada Solusi YAng Memenuhi" << endl;
    }
    
    auto end = chrono::high_resolution_clock::now();
    waktu = chrono::duration_cast<chrono::milliseconds>(end - mulai).count();
    
    cout << "Waktu pencarian: " << waktu << " ms" << endl;
    cout << "Banyak kasus yang ditinjau: " << iterasi << " kasus" << endl;
    
    return 0;
}