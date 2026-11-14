cmake_minimum_required(VERSION 3.16)
project(ckks_wasm CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Find Microsoft SEAL (compiled with Emscripten)
find_package(SEAL 4.0 CONFIG REQUIRED)

add_executable(ckks
    ckks.cpp
)

target_link_libraries(ckks PRIVATE SEAL::seal)

# Emscripten flags for WASM binary and JS glue generation
set_target_properties(ckks PROPERTIES
    OUTPUT_NAME "ckks"
    SUFFIX ".js"
)

target_link_options(ckks PRIVATE
    "--bind"
    "-sWASM=1"
    "-sALLOW_MEMORY_GROWTH=1"
    "-sMODULARIZE=1"
    "-sEXPORT_NAME='createCKKSModule'"
    "-sEXPORT_ES6=1"
    "-sNO_DISABLE_EXCEPTION_CATCHING"
    "-O3"
)

