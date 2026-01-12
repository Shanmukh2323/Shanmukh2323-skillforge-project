if (!localStorage.getItem("token")) {
    window.location.href = "login.html";
}

const courseGrid = document.getElementById("courseGrid");
const token = localStorage.getItem("token");

async function loadMyCourses() {
    try {
        const res = await fetch("http://localhost:8080/student/courses", {
            headers: {
                Authorization: "Bearer " + token
            }
        });

        const courses = await res.json();
        courseGrid.innerHTML = "";

        if (courses.length === 0) {
            courseGrid.innerHTML = "<p>No enrolled courses yet.</p>";
            return;
        }

        courses.forEach(course => {
            courseGrid.innerHTML += `
                <div class="course-card">
                    <img src="${course.image || 'https://via.placeholder.com/300'}" class="course-img">
                    <h3>${course.title}</h3>
                    <p>${course.description}</p>

                    <div class="progress-bar">
                        <div class="progress-fill" style="width:${course.progress}%"></div>
                    </div>
                    <p>${course.progress}% completed</p>

                    <button onclick="openCourse(${course.id})">
                        Continue Learning
                    </button>
                </div>
            `;
        });

    } catch (err) {
        console.error("Load courses error:", err);
    }
}

function openCourse(courseId) {
    localStorage.setItem("selectedCourse", courseId);
    window.location.href = "student_course_view.html";
}


loadMyCourses();

function logout() {
    localStorage.clear();
    window.location.href = "login.html";
}  