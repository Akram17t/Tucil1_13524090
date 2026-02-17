#include <bits/stdc++.h>
using namespace std;
#include <chrono>

char grid[100][100];
long long n, iterasi, waktu;
bool ada[100][100], solusi, frek[26], col[100];
string alasan;
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
    if (x == n){
        iterasi++;

        solusi = cek();
        if (solusi == true) { printgrid(); return; }

        // Live update setiap 50ms
        auto now = chrono::steady_clock::now();
        if (chrono::duration_cast<chrono::milliseconds>(now - lastUpdate).count() >= 50) {
            lastUpdate = now;
            cerr << "Banyak kasus yang ditinjau: " << iterasi << " kasus" << endl;
            cerr << "SNAP:";
            for (int i = 0; i < n; i++){
                if (i > 0) cerr << "|";
                for (int j = 0; j < n; j++){
                    if (ada[i][j]) cerr << "#";
                    else cerr << grid[i][j];
                }
            }
            cerr << endl;
            cerr << "REASON:" << alasan << endl;
        }
        return;
    }

    for (int i = 0; i < n; i++){
        if (solusi) return;
        if (col[i]) continue;

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
        for (int j = 0; j < n; j++)
            if (ada[x][j]){ y = j; break; }
        if (y == -1) return false;

        char warna = grid[x][y];
        for (int i = 0; i < x; i++){
            for (int j = 0; j < n; j++){
                if (ada[i][j] && (warna == grid[i][j] || (abs(x-i) <= 1 && abs(y-j) <= 1))){
                    alasan = to_string(x) + "," + to_string(y) + "," + to_string(i) + "," + to_string(j);
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

    // Emit total permutations (n!) ke stderr
    long long total = 1;
    for (int i = 1; i <= n; i++) total *= i;
    cerr << "TOTAL:" << total << endl;

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